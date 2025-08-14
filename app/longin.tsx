
import { useRouter } from 'expo-router';
import React, { useState } from 'react';


const Login = () => {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const router = useRouter();

	const handleLogin = async () => {
		if (!username || !email || !password) {
			setError('Please fill in all fields.');
			return;
		}
		// Email regex (simple)
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError('Please enter a valid email address.');
			return;
		}
		if (password.length < 8) {
			setError('Password must be at least 8 characters long.');
			return;
		}
		setError('');
		// Send registration request to backend
		try {
			const response = await fetch('http://localhost:3000/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password })
			});
			const data = await response.json();
			if (!response.ok) {
				setError(data.error || 'Registration failed');
				return;
			}
			// Registration successful, go to home page
			router.push('/home');
		} catch (err) {
			setError('Network error. Please try again.');
		}
	};

	const handleTogglePassword = () => {
		setShowPassword((prev) => !prev);
	};

	const handleGeneratePassword = () => {
		const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
		let generated = '';
		for (let i = 0; i < 8; i++) {
			generated += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		setPassword(generated);
		setError('');
	};

	return (
		<div style={{ maxWidth: 400, margin: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
			<h2>Login</h2>
					<input
						type="text"
						placeholder="Username"
						value={username}
						onChange={e => setUsername(e.target.value)}
						style={{ padding: 8, fontSize: 16 }}
					/>
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						style={{ padding: 8, fontSize: 16 }}
					/>
					<div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
						<input
							type={showPassword ? 'text' : 'password'}
							placeholder="Password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							style={{ padding: 8, fontSize: 16, flex: 1, width: '100%' }}
						/>
						<span
							onClick={handleTogglePassword}
							style={{
								position: 'absolute',
								right: 10,
								top: '50%',
								transform: 'translateY(-50%)',
								fontSize: 12,
								color: '#0070f3',
								cursor: 'pointer',
								userSelect: 'none',
								background: '#fff',
								padding: '0 4px',
								borderRadius: 3,
								zIndex: 2
							}}
						>
							{showPassword ? 'Hide' : 'Show'}
						</span>
					</div>
					<button type="button" onClick={handleGeneratePassword} style={{ padding: '8px 12px', fontSize: 14, marginTop: 6, alignSelf: 'flex-end' }}>
						Auto-generate
					</button>
			<button onClick={handleLogin} style={{ padding: 10, fontSize: 16, background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4 }}>
				Login
			</button>
			<button
				onClick={() => router.push('./signup')}
				style={{
					padding: 10,
					fontSize: 16,
					background: '#4CAF50',
					color: '#fff',
					border: 'none',
					borderRadius: 4
				}}
			>
				Sign Up
			</button>
			{error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
		</div>

		
	);
};

export default Login;
