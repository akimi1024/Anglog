import {
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";

// 新規登録
export async function registerUser(email: string, password: string) {
  await signUp({
    username: email,
    password,
    options: { userAttributes: { email } },
  });
}

// メールの確認コード入力して登録
export async function confirmUser(email: string, code: string) {
  await confirmSignUp({ username: email, confirmationCode: code });
}

// ログイン
export async function login(email: string, password: string) {
  await signIn({ username: email, password });
}

// ログアウト
export async function logout() {
  await signOut();
}

// API呼び出し用のJWT取得
export async function getIdToken(): Promise<string | undefined> {
  const session = await fetchAuthSession();
  return session.tokens?.idToken?.toString();
}

// 現在ログインユーザー
export async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    return user.signInDetails?.loginId ?? null;
  } catch {
    return null;
  }
}
