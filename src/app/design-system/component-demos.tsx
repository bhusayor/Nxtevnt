"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PasswordRequirements } from "@/components/nextevnt/password-requirements";

export function FormControlsDemo() {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="grid content-start gap-5">
        <Select
          label="Event type"
          placeholder="Choose event type"
          helperText="Used to tailor recommendations."
          options={[
            { label: "Wedding", value: "wedding" },
            { label: "Corporate event", value: "corporate" },
            { label: "Private celebration", value: "private" },
            { label: "Other", value: "other" },
          ]}
        />
        <Select
          label="Service category"
          defaultValue="planning"
          success="Service is available in your region."
          options={[
            { label: "Full-service planning", value: "planning" },
            { label: "Day-of coordination", value: "coordination" },
          ]}
        />
      </div>
      <div className="grid content-start gap-5">
        <Checkbox label="Email updates" description="Receive important event and payment updates." defaultChecked />
        <Checkbox label="Vendor suggestions" description="Personalized recommendations from NXTEVNT." />
        <Checkbox label="Terms accepted" error="You must accept the terms to continue." />
        <Checkbox label="Unavailable option" disabled />
      </div>
      <div className="grid content-start gap-7">
        <RadioGroup
          label="Preferred contact"
          defaultValue="email"
          options={[
            { value: "email", label: "Email", description: "Best for detailed updates" },
            { value: "phone", label: "Phone", description: "Best for urgent updates" },
          ]}
        />
        <div className="grid gap-5">
          <Switch label="Booking requests" description="Allow new clients to request your availability." defaultChecked />
          <Switch label="Pause notifications" description="Temporarily stop non-essential updates." />
          <Switch label="Managed by owner" disabled defaultChecked />
        </div>
      </div>
    </div>
  );
}

export function PasswordDemo() {
  const [password, setPassword] = useState("NXTEVNT9");

  return (
    <div className="grid gap-5">
      <Input
        type="text"
        label="Password preview"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        helperText="This is a component pattern preview, not an authentication form."
      />
      <PasswordRequirements password={password} />
    </div>
  );
}
