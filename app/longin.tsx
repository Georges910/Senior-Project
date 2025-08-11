import React, { useState } from 'react';


const Login = () => {
	const [usernameOrPhone, setUsernameOrPhone] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	const handleLogin = () => {
		if (!usernameOrPhone || !password) {
			setError('Please fill in all fields.');
			return;
		}
		// Email regex (simple)
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		// Phone regex (accepts numbers, optional +, 10-15 digits)
		const phoneRegex = /^\+?\d{10,15}$/;
		if (!emailRegex.test(usernameOrPhone) && !phoneRegex.test(usernameOrPhone)) {
			setError('Please enter a valid email or phone number.');
			return;
		}
		if (password.length < 8) {
			setError('Password must be at least 8 characters long.');
			return;
		}
		setError('');
		// Proceed with login logic here
		alert('Login successful!');
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
				placeholder="Username/Phone Number"
				value={usernameOrPhone}
				onChange={e => setUsernameOrPhone(e.target.value)}
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
			{error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
		</div>
	);
};

export default Login;
