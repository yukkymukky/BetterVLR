// Function to generate VCT quick links based on current year
function generateVCTQuickLinks() {
	const currentYear = new Date().getFullYear();
	let vctLinks = '';
	
	// Only show current year and past years, down to 2021
	for (let year = currentYear; year >= 2021; year--) {
		vctLinks += `
		<div class="quick-links">
			<a class="wf-module-item" href="/vct-${year}"><img src="https://owcdn.net/img/60865adcb127b.png" alt="VCT ${year}">VCT ${year}</a>
			<div class="wf-module-item" style="cursor: not-allowed;">EDIT<i class="fa fa-pencil" aria-hidden="true"></i></div>
			<div class="wf-module-item" style="cursor: not-allowed;">REMOVE<i class="fa fa-ban" aria-hidden="true"></i></div>
		</div>`;
	}
	
	return vctLinks;
}

// Function to generate VCT dropdown items
function generateVCTDropdownItems() {
	const currentYear = new Date().getFullYear();
	let vctItems = '';
	
	for (let year = currentYear; year >= 2021; year--) {
		vctItems += `<a class="wf-module-item" href="/vct-${year}"><img src="https://owcdn.net/img/60865adcb127b.png" alt="VCT ${year}">VCT ${year}</a>`;
	}
	
	return vctItems;
}

// Function to generate VCT mobile items
function generateVCTMobileItems() {
	const currentYear = new Date().getFullYear();
	let vctItems = '';
	
	for (let year = currentYear; year >= 2021; year--) {
		vctItems += `<a class="header-menu-item quick-link" href="/vct-${year}">VCT ${year}</a>`;
	}
	
	return vctItems;
}

// Function to remove a quick link
function removeQuickLink(event) {
	const quick_links = JSON.parse(localStorage.getItem("quick_links")) || [];
	const quick_link_item = $(event.target).closest(".quick-links");

	// Get the details of the quick link
	const image = quick_link_item.find("a.wf-module-item img").attr("src");
	const text = quick_link_item.find("a.wf-module-item").text();
	const href = quick_link_item.find("a.wf-module-item").attr("href");

	// Find the index of the quick link in the local storage
	const index = quick_links.findIndex((quick_link) => {
		return (quick_link.image === image && quick_link.text === text && quick_link.href === href);
	});

	if (index !== -1) {
		// Remove the quick link from the dropdown menu
		quick_link_item.remove();

		// Remove the quick link from the local storage
		quick_links.splice(index, 1);
		localStorage.setItem("quick_links", JSON.stringify(quick_links));
	}
}

// Function to display the saved quick links
function displayQuickLinks() {
	const quick_links = JSON.parse(localStorage.getItem("quick_links")) || [];
	const dropdown_content = $(".dropdown-content");
	const dropdown_content_mobile = $(".header-menu-item.quick-link:last");

	// Loop through the quick links and append them to the dropdown menu
	quick_links.forEach((quick_link) => {
		const { image, text, href } = quick_link;
		const quick_link_item = $(`<a class="wf-module-item" href="${href}"><img src="${image}" />${text}</a>`);
		dropdown_content.append(quick_link_item);
	});

	// Loop through the quick links and append them to the dropdown menu (mobile)
	quick_links.forEach((quick_link) => {
		const { text, href } = quick_link;
		const quick_link_item = $(`<a class="header-menu-item quick-link" href="${href}">${text}</a>`);
		dropdown_content_mobile.after(quick_link_item);
	});
}

// Function to display the saved quick links
function displayQuickLinksInSettings() {
	const quick_links = JSON.parse(localStorage.getItem("quick_links")) || [];
	const quick_links_settings = $("#sortable-container .quick-links:last");

	// Loop through the quick links and append them to the dropdown menu
	quick_links.forEach((quick_link) => {
		const { image, text, href } = quick_link;
		const quick_link_item = $(`
		<div class="quick-links" style="overflow-wrap: anywhere;">
			<a class="wf-module-item" href="${href}"><img src="${image}">${text}</a>
			<div class="wf-module-item">EDIT<i class="fa fa-pencil" aria-hidden="true"></i></div>
			<div class="wf-module-item">REMOVE<i class="fa fa-ban" aria-hidden="true"></i></div>
		</div>`);

		// Add event handler to the remove button
		$(document).on("click", ".wf-module-item:has(.fa-ban)", removeQuickLink);

		quick_links_settings.before(quick_link_item);
	});
}


const quick_links = `
<div id="sortable-container" class="wf-card mod-form mod-dark">
	<div class="form-section" style="margin-top: 0;">Quick Links</div>
	${generateVCTQuickLinks()}
	<div class="quick-links">
		<a class="wf-module-item" href="/transfers"><img src="https://i.imgur.com/O6aeTiv.png" alt="Transfers">Transfers</a>
		<div class="wf-module-item" style="cursor: not-allowed;">EDIT<i class="fa fa-pencil" aria-hidden="true"></i></div>
		<div class="wf-module-item" style="cursor: not-allowed;">REMOVE<i class="fa fa-ban" aria-hidden="true"></i></div>
	</div>
	<div class="quick-links">
		<div class="wf-module-item"><i class="fa fa-plus" aria-hidden="true"></i></div>
	</div>
</div>`;


// ANCHOR Add dropdown to the header
$(".header-nav-item.mod-stats").next().after(`
<div class="header-nav-item dropdown mod-vlr" style="align-items: center;" tabindex="0">
	<i class="fa fa-chevron-right" aria-hidden="true"></i>
	<div class="dropdown-content wf-card">
		${generateVCTDropdownItems()}
		<a class="wf-module-item" href="/transfers"><img src="https://i.imgur.com/O6aeTiv.png" alt="Transfers">Transfers</a>
	</div>
</div>
<div class="header-div"></div>`);
$(".header-nav-item.mod-vlr-spacing").css("width", "107px");

$(".header-switch, .mod-dropdown").attr("tabindex", "0");
$(".header-switch, .mod-dropdown").on("keydown", function (event) {
	if (event.which === 13) {
		$(this).trigger("click");
	}
});

// mobile
$(".header-menu-item:first").before(`
<div class="header-menu-item dropdown">
	<i class="fa fa-chevron-right"></i> Quick Links</div>
${generateVCTMobileItems()}
<a class="header-menu-item quick-link" href="/transfers">Transfers</a>`);

$(document).on("click", ".header-menu-item.dropdown", function () {
	if ($(".header-menu-item.quick-link").is(":visible")) {
		$(".header-menu-item.dropdown i").attr("class", "fa fa-chevron-right");
		$(".header-menu-item.quick-link").css("display", "none");
	} else {
		$(".header-menu-item.dropdown i").attr("class", "fa fa-chevron-down");
		$(".header-menu-item.quick-link").css("display", "block");
		$(".header-menu-item.quick-link").css("border-left", "2px solid");
		$(".header-menu-item.quick-link").css("border-right", "52px solid");
		$(".header-menu-item.quick-link:first").css("border-top", "2px solid");
		$(".header-menu-item.quick-link:last").css("border-bottom", "2px solid");
	}
});

displayQuickLinks();


const quick_links_popup = ({
	items: {
		src: `
		<div class="quick-links-popup wf-card">
			<form id="quick-links">
				<div>
					<label class="wf-card"><i class="fa fa-picture-o"></i></label>
					<input placeholder="IMAGE (will use default if left empty)" type="text" />
				</div>
				<div>
					<label class="wf-card"><i class="fa fa-font" style="color: #da626c;"></i></label>
					<input placeholder="TEXT" type="text" required />
				</div>
				<div>
					<label class="wf-card"><i class="fa fa-link" style="color: #da626c;"></i></label>
					<input placeholder="LINK" type="text" required />
				</div>
				<button class="btn mod-action">Save</button>
			</form>
		</div>`,
		type: "inline"
	},
	callbacks: {
		open: function () {
			// Add event listener to the form submit
			$("#quick-links").submit(function (event) {
				event.preventDefault(); // Prevent form submission

				// Get the form input values
				var image = $(`#quick-links input`).eq(0).val();
				var text = $(`#quick-links input`).eq(1).val();
				var href = $(`#quick-links input`).eq(2).val();

				// Set the default image if no image is specified
				if (image === "") {
					image = "https://www.vlr.gg/img/vlr/favicon.png";
				}

				// Create a new list item for the quick link
				const quick_link_item_dropdown = $(`<a class="wf-module-item" href="${href}"> <img src="${image}" /> ${text}</a>`);
				const quick_link_item_settings = $(`
				<div class="quick-links" style="overflow-wrap: anywhere;">
					<a class="wf-module-item" href="${href}"><img src="${image}">${text}</a>
					<div class="wf-module-item">EDIT<i class="fa fa-pencil" aria-hidden="true"></i></div>
					<div class="wf-module-item">REMOVE<i class="fa fa-ban" aria-hidden="true"></i></div>
				</div>`);

				// Append the new quick link to the dropdown menu
				$(".dropdown-content").append(quick_link_item_dropdown);
				$("#sortable-container .quick-links:last").before(quick_link_item_settings);

				// Save the quick link to local storage
				var quick_links = JSON.parse(localStorage.getItem("quick_links")) || [];
				quick_links.push({ image, text, href });
				localStorage.setItem("quick_links", JSON.stringify(quick_links));

				// Close the popup
				$.magnificPopup.close();
			});
		}
	}
});

export { quick_links, quick_links_popup, displayQuickLinksInSettings };
