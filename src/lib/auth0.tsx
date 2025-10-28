import { useAuth0 } from "@auth0/auth0-react";

export default function AuthPage() {
	const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();

	return (
		<div>
			{isAuthenticated ? (
				<>
					<p>Welcome, {user?.name}</p>
					<button onClick={() => logout({ returnTo: window.location.origin })}>
						Logout
					</button>
				</>
			) : (
				<button onClick={() => loginWithRedirect()}>Login</button>
			)}
		</div>
	);
}

export { AuthPage };
