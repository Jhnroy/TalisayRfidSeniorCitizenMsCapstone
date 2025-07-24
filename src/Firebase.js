export const auth = {
  // mock method to prevent app crash during frontend dev
  signInWithEmailAndPassword: () => Promise.resolve({ user: { uid: "dummy" } }),
};