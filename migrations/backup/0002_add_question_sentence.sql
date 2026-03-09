-- Add question_sentence field to memory_gates table
ALTER TABLE memory_gates ADD COLUMN question_sentence TEXT;

-- Update existing memory_gates with sample question_sentence
UPDATE memory_gates SET question_sentence = 
  'Yesterday, I felt a sense of ' || correct_answer || ' while walking in the park.'
WHERE question_sentence IS NULL;
