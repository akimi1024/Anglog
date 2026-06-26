export interface User {
  userId: string;
  displayName: string;
  createdAt: string;
}

export type CreateUserInput = Omit<
  User,
  "userId" | "createdAt"
>;

export type UpdateUserInput = Partial<Pick<User, "displayName">>;