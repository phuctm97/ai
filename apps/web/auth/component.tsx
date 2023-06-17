import type { CognitoUser } from "@aws-amplify/auth";
import type { ChangeEventHandler, FC, FormEventHandler } from "react";

import { Auth } from "@aws-amplify/auth";
import { useCallback, useState } from "react";

class CouldNotCompleteSignInChallengeError extends Error {
  constructor(public readonly challengeName: string) {
    super(`Couldn't complete sign in challenge: ${challengeName}.`);
  }
}

interface CompleteNewPasswordProps {
  user: CognitoUser;
  onUserChange: (user: CognitoUser) => void;
}

const CompleteNewPassword: FC<CompleteNewPasswordProps> = ({
  user,
  onUserChange,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const handleChangeNewPassword = useCallback<
    ChangeEventHandler<HTMLInputElement>
  >((e) => setNewPassword(e.target.value), [setNewPassword]);
  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault();
      Auth.completeNewPassword(user, newPassword)
        .then(onUserChange)
        .catch(console.error);
    },
    [user, onUserChange, newPassword]
  );
  return (
    <form
      className="container mx-auto flex max-w-md flex-col items-stretch justify-start px-4 py-10"
      onSubmit={handleSubmit}
    >
      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={handleChangeNewPassword}
      />
      <button type="submit">Complete new password</button>
    </form>
  );
};

export const SignIn: FC = () => {
  const [email, setEmail] = useState("");
  const handleChangeEmail = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => setEmail(e.target.value),
    [setEmail]
  );
  const [password, setPassword] = useState("");
  const handleChangePassword = useCallback<
    ChangeEventHandler<HTMLInputElement>
  >((e) => setPassword(e.target.value), [setPassword]);
  const [user, setUser] = useState<CognitoUser>();
  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault();
      Auth.signIn(email, password).then(setUser).catch(console.error);
    },
    [email, password, setUser]
  );
  if (user)
    switch (user.challengeName) {
      case undefined:
        return null;
      case "NEW_PASSWORD_REQUIRED":
        return <CompleteNewPassword user={user} onUserChange={setUser} />;
      default:
        throw new CouldNotCompleteSignInChallengeError(user.challengeName);
    }
  return (
    <form
      className="container mx-auto flex max-w-md flex-col items-stretch justify-start px-4 py-10"
      onSubmit={handleSubmit}
    >
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={handleChangeEmail}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={handleChangePassword}
      />
      <button type="submit">Sign in</button>
    </form>
  );
};
