export type CleaningRule = {
    type: 'delete_rows' | 'clear_column' | 'deduplicate' | 'custom';
    column: string;
    value?: string;
    code?: string; // pour GPT
  };