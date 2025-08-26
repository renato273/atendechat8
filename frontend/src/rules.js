const rules = {
	user: {
		static: [],
	},

	admin: {
		static: [
			"dashboard:view",
			"drawer-admin-items:view",
			"tickets-manager:showall",
			"user-modal:editProfile",
			"user-modal:editQueues",
			"ticket-options:deleteTicket",
			"contacts-page:deleteContact",
			"connections-page:actionButtons",
			"connections-page:addConnection",
			"connections-page:editOrDeleteConnection",
			"tags-page:createTag",
			"tags-page:editTag",
			"tags-page:deleteTag",
			"messages:deleteMessage"
		],
	},
};

export default rules;
