import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, User} from 'firebase/auth'

export default function() {
  const auth = getAuth()

  const user = useState<User | null>("fb_user", () => null)

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      const uid = user.uid;
      // ...
      console.info("User is signed in")
    } else {
      // User is signed out
      // ...
      console.info("User is signed out")
    }
  });
  
  const registerUser = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        if (userCredentials) {
          user.value = userCredentials.user;
          return true
        }
        return false
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.error(error.message);
        }
        return false
      })
  }

  const signinUser = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        if (userCredentials) {
          user.value = userCredentials.user;
          return true
        }
        return false
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.error(error.message);
        }
        return false
      })
  }

  return {
    user,
    registerUser,
    signinUser
  }
}