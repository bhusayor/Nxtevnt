const themes = [
  { accent: "#527c65", ink: "#315943", soft: "#edf5ef", edge: "#d5e5d9" },
  { accent: "#638ab8", ink: "#365c87", soft: "#eef4fc", edge: "#d8e4f3" },
  { accent: "#a986bf", ink: "#76518f", soft: "#f5effa", edge: "#e7dbef" },
  { accent: "#c59951", ink: "#896125", soft: "#fff7e9", edge: "#efdfc2" },
];

export const proposalTheme = (index: number) => themes[index % themes.length];
export const proposalGridClass = (count: number) => count > 3 ? "md:grid-cols-2 xl:grid-cols-4" : count === 3 ? "md:grid-cols-2 xl:grid-cols-3" : count === 2 ? "md:grid-cols-2" : "max-w-2xl grid-cols-1";
