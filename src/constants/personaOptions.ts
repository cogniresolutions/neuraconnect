// Skills that are known to work well with OpenAI's API
export const VALID_SKILLS = [
  "Natural Language Processing",
  "Content Writing",
  "Data Analysis",
  "Problem Solving",
  "Technical Writing",
  "Code Review",
  "Machine Learning",
  "Web Development",
  "Digital Marketing",
  "Financial Planning",
  "Research",
  "Education",
  "Creative Writing",
  "Customer Service",
  "Project Management",
  "Strategic Planning",
  "Business Analysis",
  "Scientific Research",
  "Mathematical Analysis",
  "Language Translation"
] as const;

// Topics that are known to work well with OpenAI's API
export const VALID_TOPICS = [
  "Technology",
  "Science",
  "Business",
  "Education",
  "Arts",
  "Health",
  "Finance",
  "Sports",
  "Entertainment",
  "Politics",
  "Environment",
  "History",
  "Literature",
  "Mathematics",
  "Philosophy",
  "Psychology",
  "Social Sciences",
  "Engineering",
  "Medicine",
  "Law"
] as const;

export type ValidSkill = typeof VALID_SKILLS[number];
export type ValidTopic = typeof VALID_TOPICS[number];