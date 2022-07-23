/* globals powercord */
const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule } = require('powercord/webpack');

const Settings = require('./Settings');

const SPACER_CHARACTER_SET = [
	'\\s',
	'‏',
	'‎',
	'​',
	'ㅤ',
	'⠀',
	'⁣',
	'━',
	'╶',
	'╴',
	'─',
	'▬',
	'\\-',
	'=',
	'<',
	'>',
];

const MIN_DIVIDER_CHARACTERS = 2;

const SPACERS_REGEX_TEXT = `[${SPACER_CHARACTER_SET.join('')}]{${MIN_DIVIDER_CHARACTERS},}`;
const REGEX = new RegExp(
	`^${SPACERS_REGEX_TEXT}(.+?)${SPACERS_REGEX_TEXT}$`,
);

module.exports = class RoleDividers extends Plugin {
	async startPlugin() {
		this.MemberRole = getModule(['MemberRole'], false);
		this.Heading = getModule(['Heading'], false).Heading;
		this.bodyTitle = getModule(['bodyTitle'], false).bodyTitle;

		this.injectRoles();

		powercord.api.settings.registerSettings(this.entityID, {
			category: this.entityID,
			label: 'Role Dividers',
			render: Settings,
		});	}

	injectRoles() {
		inject('roledividers', this.MemberRole, 'default', (_, res) => {
			const hideEmpty  = this.settings.get('hideEmpty', true);

			const rendered = res.type(res.props);
			const rendered2 = rendered.props.children.type(rendered.props.children.props);
			const roles = rendered2.props.children[0];

			let previousWasDivider = false;
			roles.forEach((data, i) => {
				const role = data.props.role;
				const name = role.name;
				const match = name.match(REGEX);
				if (match) roles[i] = this.Heading({
					variant: 'eyebrow',
					className: `${this.bodyTitle} role-divider`,
					color: 'header-secondary',
					level: 3,
					children: match[1],
					style: {
						width: '100%',
						marginTop: '8px',
					},
				});

				if (hideEmpty) {
					if (match && previousWasDivider) {
						roles[i - 1] = undefined;
					}
					previousWasDivider = match;
				}
			});

			if (hideEmpty && previousWasDivider) roles[roles.length - 1] = undefined;

			res.type = () => rendered;

			return res;
		});
	}

	pluginWillUnload() {
		uninject('roledividers');
		powercord.api.settings.unregisterSettings(this.entityID);
	}
};
