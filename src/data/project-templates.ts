
export type PartialTask = {
    title: string;
    description: string;
};

export interface ProjectTemplate {
    id: string;
    name: string;
    steps: PartialTask[];
}

export const initialProjectTemplates: ProjectTemplate[] = [
  {
    id: 'template-1',
    name: "Standard Web App",
    steps: [
      { title: "Project Kick-off Meeting", description: "Initial meeting with stakeholders." },
      { title: "Design Mockups", description: "Create UI mockups in Figma." },
      { title: "Develop Frontend", description: "Build React components and pages." },
      { title: "Develop Backend API", description: "Create necessary API endpoints." },
      { title: "User Acceptance Testing", description: "Testing by the client/end-users." },
      { title: "Deployment", description: "Deploy to production environment." },
    ]
  },
  {
    id: 'template-2',
    name: "Marketing Campaign",
    steps: [
        { title: "Define Campaign Goals", description: "Set clear objectives and KPIs." },
        { title: "Identify Target Audience", description: "Research and define the ideal customer profile." },
        { title: "Create Marketing Assets", description: "Develop ad copy, visuals, and landing pages." },
        { title: "Launch Campaign", description: "Push the campaign live across selected channels." },
        { title: "Monitor and Optimize", description: "Track performance and make adjustments." },
        { title: "Final Report", description: "Summarize campaign results." },
    ]
  }
];
