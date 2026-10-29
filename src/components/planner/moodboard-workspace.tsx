"use client";

import { useEffect, useRef, useState } from "react";
import { Archive, FolderPlus, ImageIcon, LockSimple, Pencil, Plus, RotateCcw, Search, Trash2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { EventTierChip } from "@/components/planner/event-tier-chip";
import { SearchInput } from "@/components/ui/search-input";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { MoodboardPhotoPanel } from "./moodboard-photo-panel";
import { MoodboardBoardCard } from "./moodboard-board-card";
import { MoodboardBoardDetail } from "./moodboard-board-detail";
import { MoodboardEditor, MoodboardItemEditor } from "./moodboard-dialogs";
import { prepareEventImage } from "@/lib/event-images";
import { deleteMoodboardImage, storeMoodboardImage } from "@/lib/moodboard-images";
import { budgetItemsForEvent } from "@/lib/planner-budget";
import { assertEventStorageSpace, dataImageBytes } from "@/lib/event-storage";
import { usePlannerTeam } from "@/lib/planner-team";
import { updatePlannerEvent, type EventItem, type PlannerEvent } from "@/lib/planner-events";
import { addMoodboardItems, archiveMoodboard, commentOnMoodboard, commentOnMoodboardImage, updateMoodboardImage, approveMoodboardImage, orderMoodboardPhotos, createMoodboard, deleteMoodboard, editMoodboard, editMoodboardItem, eventMoodboards, itemsInBoard, moodboardImageLimit, moodboardLimitForEvent, removeMoodboardItem, setMoodboardCover, type BoardActivity, type MoodboardBoard, type MoodboardSource } from "@/lib/planner-moodboards";
import { cn } from "@/lib/utils/cn";

type Deleting = { kind: "board"; board: MoodboardBoard } | { kind: "item"; board: MoodboardBoard; item: EventItem };

export function MoodboardWorkspace({ event, startAdding = false }: { event: PlannerEvent; startAdding?: boolean }) {
  const boards = eventMoodboards(event);
  const active = boards.filter((board) => !board.archivedAt);
  const boardLimit = moodboardLimitForEvent(event);
  const boardLimitReached = active.length >= boardLimit;
  const [selectedId, setSelectedId] = useState<string | null>(startAdding ? active[0]?.id ?? null : null);
  const [filter, setFilter] = useState<"all" | MoodboardSource>("all");
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false);
  const [boardEditor, setBoardEditor] = useState<{ board?: MoodboardBoard } | null>(startAdding && !active.length ? {} : null);
  const [itemEditor, setItemEditor] = useState<{ item?: EventItem } | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Deleting | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const uploading = useRef(false), uploadEpoch = useRef(0);
  useEffect(() => () => { uploadEpoch.current++; }, [event.id]);
  const team = usePlannerTeam();
  const author = team.find((member) => member.isOwner)?.name || "Planner";
  const selected = boards.find((board) => board.id === selectedId);
  const viewingPhoto = selected ? itemsInBoard(event, selected.id).find((item) => item.id === viewingId && item.image) : undefined;
  const panelPhotos = selected && viewingPhoto ? orderMoodboardPhotos(itemsInBoard(event, selected.id).filter((item) => item.image && Boolean(item.imageArchivedAt) === Boolean(viewingPhoto.imageArchivedAt))) : [];
  const sourceBoards = boards.filter((board) => Boolean(board.archivedAt) === archived);
  const visible = sourceBoards.filter((board) => (filter === "all" || board.source === filter) && `${board.title} ${board.description || ""}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const activity = (kind: BoardActivity["kind"], body: string): BoardActivity => ({ id: crypto.randomUUID(), kind, body, author, createdAt: new Date().toISOString() });

  function save(change: (current: PlannerEvent) => PlannerEvent, message: string) {
    try {
      let found = false;
      updatePlannerEvent(event.id, (current) => { found = true; return change(current); });
      if (!found) throw new Error("This event no longer exists. Return to Events and open it again.");
      setError(""); setNotice(message); return true;
    } catch (problem) { setError(problem instanceof Error ? problem.message : "This change couldn’t be saved. Please try again."); return false; }
  }
  function boardActions(board: MoodboardBoard) {
    return [
      { label: "Edit board", icon: <Pencil />, disabled: Boolean(board.archivedAt) || Boolean(busy), onSelect: () => { setError(""); setBoardEditor({ board }); } },
      { label: board.archivedAt ? "Restore board" : "Archive board", icon: board.archivedAt ? <RotateCcw /> : <Archive />, disabled: Boolean(busy), onSelect: () => save((current) => archiveMoodboard(current, board.id, !board.archivedAt, activity("updated", board.archivedAt ? "Restored the board." : "Archived the board.")), board.archivedAt ? "Board restored." : "Board archived. Its photos and conversation are kept.") },
      { label: "Delete board", icon: <Trash2 />, destructive: true, disabled: Boolean(busy), onSelect: () => { setError(""); setDeleting({ kind: "board", board }); } },
    ];
  }
  async function uploadImages(files: File[]) {
    if (!selected || selected.archivedAt || uploading.current || !files.length) return;
    const boardId = selected.id;
    const count = itemsInBoard(event, boardId).filter((item) => item.image).length;
    if (count + files.length > moodboardImageLimit) { setError(`This board has room for ${Math.max(0, moodboardImageLimit - count)} more images. Select fewer files.`); return; }
    const invalid = files.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > 12 * 1024 * 1024);
    if (invalid) { setError(`“${invalid.name}” must be a JPG, PNG or WebP image under 12 MB. No images were added.`); return; }
    uploading.current = true; const epoch = ++uploadEpoch.current;
    const prepared: EventItem[] = [];
    let pendingBytes = 0;
    try {
      for (const [index, file] of files.entries()) {
        setBusy(`Preparing image ${index + 1} of ${files.length}…`);
        const data = await prepareEventImage(file, 500_000);
        if (epoch !== uploadEpoch.current) throw new Error("Upload cancelled.");
        const bytes = dataImageBytes(data);
        await assertEventStorageSpace(event, budgetItemsForEvent(event.id), pendingBytes + bytes);
        pendingBytes += bytes;
        const id = crypto.randomUUID(), image = await storeMoodboardImage(`${event.id}_${id}`, data);
        prepared.push({ id, image, boardId, title: (file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ").trim() || "Inspiration").slice(0, 120), imageCategory: "Other", imageAddedBy: author, imageAddedAt: new Date().toISOString() });
      }
      if (epoch !== uploadEpoch.current) throw new Error("Upload cancelled.");
      const result = save((current) => addMoodboardItems(current, boardId, prepared, activity("photos", `Added ${prepared.length} ${prepared.length === 1 ? "image" : "images"} to the board.`)), `${prepared.length} ${prepared.length === 1 ? "image added" : "images added"} to the board.`);
      if (!result) await Promise.all(prepared.map((item) => deleteMoodboardImage(item.image).catch(() => {})));
    } catch (problem) {
      await Promise.all(prepared.map((item) => deleteMoodboardImage(item.image).catch(() => {})));
      if (epoch === uploadEpoch.current) setError(`${problem instanceof Error ? problem.message : "These images couldn’t be uploaded."} No images were added.`);
    } finally { uploading.current = false; if (epoch === uploadEpoch.current) setBusy(""); }
  }
  function remove() {
    if (!deleting) return false;
    const items = deleting.kind === "board" ? itemsInBoard(event, deleting.board.id) : [deleting.item];
    const removed = deleting.kind === "board" ? save((current) => deleteMoodboard(current, deleting.board.id), "Board deleted.") : save((current) => removeMoodboardItem(current, deleting.board.id, deleting.item.id, activity("updated", `Removed “${deleting.item.title}”.`)), "Item deleted.");
    if (removed) { void Promise.all(items.filter((item) => !event.sections.decisions.some((decision) => decision.sourceMoodboardImageId === item.id)).flatMap((item) => [deleteMoodboardImage(item.image).catch(() => {}), deleteMoodboardImage(item.designApproval?.evidence).catch(() => {})])); if (deleting.kind === "board" && selectedId === deleting.board.id) setSelectedId(null); setDeleting(null); }
    return removed;
  }

  return <div className="space-y-5">
    {error && !boardEditor && !itemEditor && !deleting && !viewingPhoto && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-error-soft px-4 py-3 text-xs leading-5 text-error"><span>{error}</span>{error.includes("storage limit") && event.tier !== "premium" && <EventTierChip eventId={event.id} eventName={event.name} tier={event.tier} mode="storage-link" />}</div>}<p role="status" className="sr-only">{notice}</p>
    {selected ? <MoodboardBoardDetail key={selected.id} board={selected} items={itemsInBoard(event, selected.id)} author={author} busy={busy} onBack={() => { setSelectedId(null); setError(""); }} onUpload={(files) => void uploadImages(files)} onLink={() => { setError(""); setItemEditor({}); }} onEditItem={(item) => { setError(""); setItemEditor({ item }); }} onDeleteItem={(item) => { setError(""); setDeleting({ kind: "item", board: selected, item }); }} onView={(item) => { setError(""); setViewingId(item.id); }} onComment={(body) => save((current) => commentOnMoodboard(current, selected.id, activity("comment", body)), "Comment posted.")} actions={boardActions(selected)} /> : <>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="mb-2 flex items-center gap-2 text-[0.625rem] font-semibold uppercase tracking-[.14em] text-[#8b7656]"><ImageIcon className="size-4" aria-hidden="true" />The look & feel</p><h2 className="text-2xl font-semibold tracking-tight">Moodboards</h2><p className="mt-2 max-w-xl text-xs leading-6 text-text-secondary">Bring the spaces, colours and thoughtful details for {event.name} together.</p></div><div className="flex shrink-0 flex-wrap items-center gap-3"><span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">{active.length} of {boardLimit} boards{event.tier !== "premium" && <> <span aria-hidden="true">·</span> <EventTierChip mode="moodboard-link" eventId={event.id} eventName={event.name} tier={event.tier} cancelled={Boolean(event.cancelledAt)} /></>}</span><Button type="button" size="sm" disabled={boardLimitReached} aria-label={boardLimitReached ? `Create board locked at ${boardLimit} boards` : "Create board"} leadingIcon={boardLimitReached ? <LockSimple className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />} onClick={() => { setError(""); setBoardEditor({}); }}>Create board</Button></div></header>
      <div className="flex flex-col gap-4 border-b border-border-subtle pb-3 sm:flex-row sm:items-center sm:justify-between"><div role="group" aria-label="Filter moodboards by source" className="inline-flex w-fit max-w-full rounded-xl border border-border-subtle bg-white p-1">{[{ id: "all", label: "All boards" }, { id: "planner", label: "Planner" }, { id: "client", label: "Client’s" }].map((tab) => <button type="button" key={tab.id} aria-pressed={filter === tab.id} onClick={() => setFilter(tab.id as typeof filter)} className={cn("inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors", filter === tab.id ? "bg-[#eaf3ed] text-brand-primary" : "text-text-secondary hover:bg-background-subtle")}>{tab.label}<span className={cn("text-xs", filter === tab.id ? "text-brand-primary/75" : "text-text-tertiary")}>{sourceBoards.filter((board) => tab.id === "all" || board.source === tab.id).length}</span></button>)}</div><div className="flex min-w-0 items-center gap-2"><div className="min-w-0 flex-1 sm:w-56"><SearchInput aria-label="Search moodboards" placeholder="Find a board…" value={search} onChange={(input) => setSearch(input.target.value)} onClear={() => setSearch("")} /></div><button type="button" aria-pressed={archived} onClick={() => setArchived((value) => !value)} className={cn("inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium", archived ? "border-brand-primary bg-white text-brand-primary" : "border-transparent text-text-secondary hover:bg-white")}><Archive className="size-4" aria-hidden="true" />Archived<span className="text-[0.625rem]">{boards.filter((board) => board.archivedAt).length}</span></button></div></div>
      {archived && <p className="text-xs leading-5 text-text-secondary">Archived boards keep their images and conversation. Restore a board when you need it again.</p>}
      {boardLimitReached && !archived && <p className="rounded-xl border border-border-subtle bg-white px-4 py-3 text-xs text-text-secondary">All {boardLimit} board spaces are in use. Archive one from its menu to make room for a new direction.</p>}
      {visible.length ? <div className="grid grid-cols-[repeat(auto-fill,minmax(0,min(100%,18rem)))] items-start gap-4">{visible.map((board) => <MoodboardBoardCard key={board.id} board={board} items={itemsInBoard(event, board.id)} onOpen={() => { setSelectedId(board.id); setError(""); }} actions={boardActions(board)} />)}{!archived && !search.trim() && !boardLimitReached && <button type="button" onClick={() => { setError(""); setBoardEditor({}); }} className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8ddd5] bg-white/60 p-4 text-center transition-colors hover:border-brand-primary hover:bg-white focus-visible:outline-2 focus-visible:outline-brand-primary"><span className="flex size-12 items-center justify-center rounded-2xl border border-border-subtle bg-white text-brand-primary"><FolderPlus className="size-6" weight="duotone" aria-hidden="true" /></span><span className="mt-4 text-sm font-semibold">Create another board</span><span className="mt-2 max-w-52 text-xs leading-6 text-text-tertiary">{Math.max(0, boardLimit - active.length)} of {boardLimit} board spaces available.</span><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary"><Plus className="size-3.5" aria-hidden="true" />Create board</span></button>}</div> : <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-white px-6 py-14 text-center">{search ? <Search className="size-8 text-text-tertiary" aria-hidden="true" /> : <FolderPlus className="size-10 text-[#8b806b]" weight="duotone" aria-hidden="true" />}<h3 className="mt-5 text-lg font-semibold">{search ? "No boards match that search" : archived ? "Nothing archived yet" : filter === "client" ? "A home for your client’s ideas" : "Every great event starts with a feeling"}</h3><p className="mt-2 max-w-sm text-xs leading-6 text-text-secondary">{search ? "Try a different name or clear the search." : archived ? "Boards you archive will stay here, with their images and activity intact." : "Create a board for the venue, styling or details. Add images and talk through the ideas together."}</p>{!archived && !search && !boardLimitReached && <Button type="button" size="sm" className="mt-5" onClick={() => { setError(""); setBoardEditor({}); }}>Create {filter === "client" ? "client’s" : "your first"} board</Button>}{search && <button type="button" onClick={() => setSearch("")} className="mt-4 text-xs font-semibold text-brand-primary">Clear search</button>}</div>}
      <p className="text-[0.625rem] leading-5 text-text-tertiary">Up to {boardLimit} active boards · 50 images per board. Boards, images and activity are saved in this browser; live client sharing isn’t connected yet.</p>
    </>}
    {boardEditor && <MoodboardEditor key={boardEditor.board?.id || "new"} board={boardEditor.board} limit={boardLimit} error={error} defaultSource={filter === "client" ? "client" : "planner"} onClose={() => { setBoardEditor(null); setError(""); }} onSave={(fields) => {
      if (boardEditor.board) return save((current) => editMoodboard(current, boardEditor.board!.id, fields, activity("updated", "Updated the board details.")), "Board updated.");
      const id = crypto.randomUUID();
      if (!save((current) => createMoodboard(current, { id, ...fields }, activity("created", "Created this board.")), "Board created. Add images to bring it to life.")) return false;
      setArchived(false); setSelectedId(id); return true;
    }} />}
    {itemEditor && selected && <MoodboardItemEditor key={itemEditor.item?.id || "new-link"} item={itemEditor.item} error={error} onClose={() => { setItemEditor(null); setError(""); }} onSave={(item) => itemEditor.item ? save((current) => editMoodboardItem(current, selected.id, item, activity("updated", `Updated “${item.title}”.`)), "Details updated.") : save((current) => addMoodboardItems(current, selected.id, [item], activity("updated", `Saved the link “${item.title}”.`)), "Inspiration link saved.")} />}
    {viewingPhoto && selected && <MoodboardPhotoPanel event={event} photo={viewingPhoto} photos={panelPhotos} board={selected} author={author} clientName={event.clientName} error={error} busy={Boolean(busy)} onClose={() => { setViewingId(null); setError(""); }} onNavigate={(id) => { setViewingId(id); setError(""); }} onApprove={(mode, input) => save((current) => approveMoodboardImage(current, selected.id, viewingPhoto.id, mode, activity("updated", mode === "client" ? `Requested client confirmation for “${viewingPhoto.title}”.` : `Approved “${viewingPhoto.title}” on the client’s behalf.`), input), mode === "client" ? "Design decision saved as awaiting client confirmation." : "Design decision saved as approved on the client’s behalf.")} onChange={(change, message) => save((current) => updateMoodboardImage(current, selected.id, viewingPhoto.id, change, activity("updated", message)), message)} onComment={(body) => save((current) => commentOnMoodboardImage(current, selected.id, viewingPhoto.id, { id: crypto.randomUUID(), body, author, createdAt: new Date().toISOString() }), "Image comment posted.")} onEdit={() => { setViewingId(null); setError(""); setItemEditor({ item: viewingPhoto }); }} onCover={() => { save((current) => setMoodboardCover(current, selected.id, viewingPhoto.id, activity("updated", "Changed the board cover.")), "Board cover updated."); }} onDelete={() => { setError(""); setDeleting({ kind: "item", board: selected, item: viewingPhoto }); }} />}
    <DeleteConfirmation open={Boolean(deleting)} onOpenChange={(open) => { if (!open) { setDeleting(null); setError(""); } }} title={deleting?.kind === "board" ? "Delete moodboard?" : "Delete inspiration?"} description={deleting?.kind === "board" ? `“${deleting.board.title}”, its images, saved links and conversation will be deleted. This can’t be undone. Archive it instead if you might need it later.` : `“${deleting?.item.title}” will be removed from this board. This can’t be undone. Recorded decisions and their attachments stay in decision history.`} error={error} onConfirm={remove} />
  </div>;
}
