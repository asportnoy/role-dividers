const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule } = require('powercord/webpack');

const SPACER_CHARACTER_SET = [
	'\\s',
	'‏',
	'‎',
	'​',
	'ㅤ',
	'⠀',
	'━',
	'╶',
	'╴',
	'─',
	'-',
	'=',
];

const REGEX = new RegExp(`^[${SPACER_CHARACTER_SET.join('')}]{5,}(.+?)[${SPACER_CHARACTER_SET.join('')}]{5,}$`);

module.exports = class MessageTooltips extends Plugin {
	async startPlugin() {
		this.MemberRole = getModule(['MemberRole'], false);
		this.Heading = getModule(['Heading'], false).Heading;
		this.bodyTitle = getModule(['bodyTitle'], false).bodyTitle;

		this.injectRoles();

		console.log(this.MemberRole);
	}

	injectRoles() {
		inject('roledividers', this.MemberRole, 'default', (_, res) => {
			const rendered = res.type(res.props);
			const rendered2 = rendered.props.children.type(rendered.props.children.props);
			const roles = rendered2.props.children[0];

			roles.forEach((data, i) => {
				const role = data.props.role;
				const name = role.name;
				const match = name.match(REGEX);
				if (match) roles[i] = this.Heading({
					variant: 'eyebrow',
					className: this.bodyTitle,
					color: 'header-secondary',
					level: 3,
					children: match[1],
					style: {
						width: '100%',
						marginTop: '8px',
					},
				});
			});

			res.type = () => rendered;

			return res;
		});
	}

	pluginWillUnload() {
		uninject('roledividers');
	}
};
