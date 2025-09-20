import { quick_links, quick_links_popup, displayQuickLinksInSettings } from "./quick-links";

// Navbar
if (window.location.href.startsWith("https://www.vlr.gg/settings")) {
	const navbar = `
	<div class="wf-card mod-header mod-full">
		<div class="wf-nav">
			<a class="wf-nav-item mod-first" href="https://www.vlr.gg/settings">
				<div class="wf-nav-item-title">VLR</div>
			</a>
			<a class="wf-nav-item" href="https://www.vlr.gg/settings?yukkysvlr">
				<div class="wf-nav-item-title">YukkysVLR</div>
			</a>
			<a class="wf-nav-item" href="https://www.vlr.gg/settings?block-list">
				<div class="wf-nav-item-title">Block List</div>
			</a>
		</div>
	</div>`;

	$(".col-container").before(navbar);
}

// Navbar active class
$(document).ready(function () {
	const current_page = window.location.href;

	$(".wf-nav-item").each(function () {
		const href = $(this).attr("href");
		if (current_page === href) {
			$(this).addClass("mod-active");
		}
	});
});

// BetterVLR
const display = `
<span class="wf-label mod-sidebar" style="padding-left: 0px;">YukkysVLR is a fork of BetterVLR, all credit to the original creators</span>
<div class="wf-card mod-form mod-dark">
	<div class="form-section" style="margin-top: 0;">Display</div>
	<div class="form-label">Threads</div>
	<div style="margin-bottom: 5px;">
		<input type="checkbox" id="hide_flags">
		<span style="font-size: 11px; vertical-align: -1px; margin-left: 1px;">Hide Flags</span>
	</div>
	<div style="margin-bottom: 5px;">
		<input type="checkbox" id="hide_stars">
		<span style="font-size: 11px; vertical-align: -1px; margin-left: 1px;">Hide Stars</span>
	</div>
	<div class="form-label" style="margin-top: 15px;">General</div>
	<div style="margin-bottom: 5px;">
		<input type="checkbox" id="esports_mode">
		<span style="font-size: 11px; vertical-align: -1px; margin-left: 1px;">Esports Mode</span>
	</div>
	<div style="margin-bottom: 5px;">
		<input type="checkbox" id="sticky_header">
		<span style="font-size: 11px; vertical-align: -1px; margin-left: 1px;">Sticky Header</span>
	</div>
</div>`;

const discussions = `
<div class="wf-card mod-form mod-dark">
	<div class="form-section" style="margin-top: 0;">Discussion</div>
	<div style="margin-bottom: 5px;">
		<input type="checkbox" id="hide_match_comments">
		<span style="font-size: 11px; vertical-align: -1px; margin-left: 1px;">Hide Match Comments</span>
	</div>
</div>`;

const sidebar = `
<div class="wf-card mod-form mod-dark">
	<div class="form-section" style="margin-top: 0;">General</div>
	<div class="form-hint">select which items to hide</div>
	<div class="form-label" style="margin-top: 15px;">Valorant</div>
	<div style="margin-bottom: 5px;">
		<input type="checkbox" id="hide_live_streams">
		<span style="font-size: 11px; vertical-align: -1px; margin-left: 1px;">Hide Live Streams (unofficial ones only)</span>
	</div>
	<div class="form-label" style="margin-top: 15px;">General</div>
	<div style="margin-bottom: 5px;">
		<input type="checkbox" id="hide_stickied_threads">
		<span style="font-size: 11px; vertical-align: -1px; margin-left: 1px;">Hide Stickied Threads</span>
	</div>
	<div style="margin-bottom: 5px;">
		<input type="checkbox" id="hide_recent_discussions">
		<span style="font-size: 11px; vertical-align: -1px; margin-left: 1px;">Hide Recent Discussions</span>
	</div>
  <div style="margin-bottom: 5px;">
		<input type="checkbox" id="hide_bookmarked_threads">
		<span style="font-size: 11px; vertical-align: -1px; margin-left: 1px;">Hide Bookmarked Threads</span>
	</div>
  <div style="margin-bottom: 5px;">
		<input type="checkbox" id="hide_collapsable_option">
		<span style="font-size: 11px; vertical-align: -1px; margin-left: 1px;">Hide Collapsable Options</span>
	</div>
  <div style="margin-bottom: 5px;">
		<input type="checkbox" id="limit_stat_page_results">
		<span style="font-size: 11px; vertical-align: -1px; margin-left: 1px;">Limit Initial State Page Results</span>
	</div>
</div>`;

const misc = `
<div class="wf-card mod-form mod-dark">
	<div class="form-section" style="margin-top: 0;">Misc</div>
	<div style="margin-bottom: 5px;">
		<input type="checkbox" id="imgur_proxy">
		<span style="font-size: 11px; vertical-align: -1px; margin-left: 1px;">Imgur Proxy (enable this if imgur is blocked for you)</span>
	</div>
</div>`;

if (window.location.search === "?yukkysvlr") {
	$(".wf-card.mod-form").not("form .wf-card.mod-form").hide();
	const form = $("form:eq(1)");
	form.html(display + discussions + sidebar + quick_links + misc);
	$(".quick-links div:has(.fa-plus)").magnificPopup(quick_links_popup);
	displayQuickLinksInSettings();
}

// Blocked users
const blocked_users = `
<div class="wf-card mod-form mod-dark">
	<div class="form-section" style="margin: 0;">Block Users</div>
	<div style="display: flex; justify-content: space-between; padding: 15px 20px 15px 0; flex-wrap: wrap; gap: 5px;">
		<input type="text" id="user-to-block" placeholder="USER TO BLOCK" style="margin: 0px">
		<button id="block-user" class="btn mod-action" style="background-color: #d04e59; width: 50px;">Block</button>
	</div>
	<ul id="blocked_users"></ul>
</div>`;

const blocked_words = `
<div class="wf-card mod-form mod-dark">
	<div class="form-section" style="margin: 0;">Block Words</div>
	<div style="display: flex; justify-content: space-between; padding: 15px 20px 15px 0; flex-wrap: wrap; gap: 5px;">
		<input type="text" id="word-to-block" placeholder="WORD TO BLOCK" style="margin: 0px">
		<div class="selector">
			<div class="wf-label comments-label" style="margin-right: 12px; padding: 0;">BLOCK WORD IN:</div>
			<select id="block-option" style="margin: 0;">
				<option value="Thread Title">Thread Title</option>
				<option value="Posts">Posts</option>
				<option value="Both">Both</option>
			</select>
		</div>
		<button id="block-word" class="btn mod-action" style="background-color: #d04e59; width: 50px;">Block</button>
	</div>
	<ul id="blocked_words"></ul>
</div>`;

if (window.location.search === "?block-list") {
	$(".wf-card.mod-form").not("form .wf-card.mod-form").hide();
	const form = $("form:eq(1)");
	form.html(blocked_users + blocked_words);
}
