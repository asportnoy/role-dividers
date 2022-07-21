const { React } = require('powercord/webpack');
const { SwitchItem } = require('powercord/components/settings');

module.exports = class Settings extends React.PureComponent {
	render() {
		const { getSetting, toggleSetting } = this.props;

		return (
			<div>
				<SwitchItem
					value={getSetting('hideEmpty', true)}
					onChange={() => toggleSetting('hideEmpty', true)}
				>
					Hide dividers with no roles under them
				</SwitchItem>
			</div>
		);
	}
};