import { useState } from 'react';
import { TextInput, Textarea, Button, Stack } from '@mantine/core';
import useData from '../context/data/useData';

const CreateDocumentForm = ({ onSuccess }) => {
  const { createDocument } = useData();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDocumentsLoading(true);
    const success = await createDocument({ title, content });
    setDocumentsLoading(false);
    
    if (success && onSuccess) {
      setTitle('');
      setContent('');
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          label="Title"
          placeholder="Q4 Report"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          label="Content"
          placeholder="Confidential details..."
          required
          minRows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button type="submit" loading={documentsLoading}>Save Document</Button>
      </Stack>
    </form>
  );
};

export default CreateDocumentForm;