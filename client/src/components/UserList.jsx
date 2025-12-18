import { Table, Badge, ActionIcon, Loader, Center, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import useData from "../context/data/useData";
import Can from "./Can";

const UserList = () => {
  const { users, usersLoading, deleteUser } = useData();

  if (usersLoading) {
    return (
      <Center p="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Text c="dimmed" ta="center" mt="md">
        No users found.
      </Text>
    );
  }

  const rows = users.map((user) => (
    <Table.Tr key={user.id}>
      <Table.Td>{user.id}</Table.Td>
      <Table.Td>{user.username}</Table.Td>
      <Table.Td>
        <Badge
          color={
            user.role === "Admin"
              ? "red"
              : user.role === "Editor"
              ? "blue"
              : "gray"
          }
        >
          {user.role}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Can perform="write:users">
          <ActionIcon
            color="red"
            variant="subtle"
            onClick={() => {
              if (
                confirm(`Are you sure you want to delete ${user.username}?`)
              ) {
                deleteUser(user.id);
              }
            }}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Can>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>ID</Table.Th>
          <Table.Th>Username</Table.Th>
          <Table.Th>Role</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
};

export default UserList;
