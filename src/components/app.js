import { h } from 'preact';
import { Router } from 'preact-router';
import baseroute from '../baseroute';

import Header from './header';

// Code-splitting is automated for `routes` directory
import Home from '../routes/home';
import Profile from '../routes/profile';

const App = () => (
	<div id="app">
		{/* <Header /> */}
		<main>
			<Router>
				<Home path={`${baseroute}/`} />
				{/* <Profile path="/profile/" user="me" />
				<Profile path="/profile/:user" /> */}
			</Router>
		</main>
	</div>
);

export default App;
