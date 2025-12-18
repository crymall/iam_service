import { SimpleGrid, Card, Text, Group, Badge, Button, Center, Loader } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import useData from '../context/data/useData';
import Can from './Can';

const DocumentList = () => {
  const { documents, documentsLoading, deleteDocument } = useData();

  if (documentsLoading) {
    return (
      <Center p="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Text c="dimmed" ta="center" mt="md">
        No documents found.
      </Text>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
      {documents.map((doc) => (
        <Card key={doc.id} shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" mt="md" mb="xs">
            <Text fw={500}>{doc.title}</Text>
            <Badge color="blue" variant="light">Confidential</Badge>
          </Group>

          <Text size="sm" c="dimmed" mb="lg" style={{ minHeight: '60px' }}>
            {doc.content}
          </Text>

          <Can perform="delete:documents">
            <Button 
              color="red" 
              fullWidth 
              variant="light" 
              leftSection={<IconTrash size={14} />}
              onClick={() => {
                if(confirm('Delete this file?')) deleteDocument(doc.id);
              }}
            >
              Delete File
            </Button>
          </Can>
        </Card>
      ))}
    </SimpleGrid>
  );
};

export default DocumentList;