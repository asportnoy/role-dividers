# Role Dividers
Turns "divider" roles into actual dividers. Works with Replugged and Powercord.

[Install in Replugged](https://replugged.dev/install?url=asportnoy/powercord-role-dividers)

## Demo

Before:  
![Before](https://i.imgur.com/Dz8UsOM.png)  
After:  
![After](https://i.imgur.com/pjBgCif.png)

## FAQ

### A divider role I have is not being shown as a divider.
This plugin was made to support a variety of divider formats. However, if a certain divider name isn't working (or is being flagged incorrectly), please create an issue with the role name so I can update the plugin to support it.

### How can I change the divider style?
You can style the dividers by selecting the `.role-divider` class. Here's an example made by [@12944qwerty](https://github.com/12944qwerty):
```css
.role-divider {
  font-weight: normal !important;
  text-transform: capitalize;
  margin-bottom: 2px;
  margin-top: 2px !important;
}
```
![Custom style](https://i.imgur.com/le8fziz.png)

### How do I remove a divider role from someone in my server?
You can manage divider roles in the member context menu. Right click on the member and go to the "Roles" section, then click on any roles you want to remove.

### Some divider roles are completely missing from a member!
By default, this plugin will hide any divider roles that do not have any roles under them. This can be turned off in settings.
