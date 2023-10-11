// https://www.upwork.com/nx/find-work/sw.js
// window.$nuxt.$store._vm.$data.$$state['feedMy']['jobs'][0].recno

window.SERVER_URL = "http://146.19.170.48";

window.AUTO_ENABLED = 1;
window.PRE = [1, 2];

window.CHANNELS = [1];
window.CHANNEL_INDEX = 0;
window.AUTO_INTERVAL = 5000;

function getNextChannel() {
	let channel = window.CHANNELS[window.CHANNEL_INDEX];
	window.CHANNEL_INDEX = (window.CHANNEL_INDEX + 1) % window.CHANNELS.length;
	return channel;
}

function resetAuto() {
	Array.from(document.querySelectorAll("[data-test=job-tile-list]>section")).forEach(
		(el) => el.classList.remove('v-checked-autoapply')
	);
}

window.setTimeout(async () => {
	if (document.querySelectorAll("[data-test=job-tile-list]").length) {
		(function () {
			let styleSheet = document.createElement("style");
			styleSheet.innerText = `
[data-test=job-tile-list]>section .up-label-auto{
	display: inline-block;
	margin-top: 0.25rem;
	margin-right: 0.5rem;
	padding: 0.125rem 0.75rem 0.125rem 0.5rem;
	color: #fff;
	background: #0093ff;
	font-size: .75rem;
	vertical-align: top;
	white-space: nowrap;
	border: none;
	border-radius: 1rem;
}
[data-test=job-tile-list]>section .up-label-auto.up-label-auto-outline{
	color: #00adff;
	background: none;
	outline: 1px solid #00adff;
	outline-offset: -1px;
}
[data-test=job-tile-list]>section .up-btn-z-auto{
	margin: 0 0 0 1.5rem;
	width: 4rem;
	height: 1.25rem;
	font-size: .625rem;
	vertical-align: middle;
	color: #ff00dd;
	opacity: .7;
	outline: none;
}
[data-test=job-tile-list]>section .up-btn-z-auto:hover{
	color: #dc3545;
	opacity: 1;
}
[data-test=job-tile-list]>section.collapsed .up-btn-z-auto{
	display: none;
}`;
			document.head.appendChild(styleSheet);
		})();

		// Array.from(document.querySelectorAll("[data-test=job-tile-list]>section")).forEach(
		// 	(el) => el.classList.add('v-checked-autoapply')
		// );
		Array.from(document.querySelectorAll("[data-test=job-tile-list]>section.v-checked-autobtn")).forEach(
			(el) => el.classList.remove('v-checked-autobtn')
		);
		if (window["last_t"])
			window[window["last_t"]] = false;
		let t = new Date().getTime();
		window["last_t"] = t;
		window[t] = t;
		while (window[t]) {
			{
				let sections = document.querySelectorAll("[data-test=job-tile-list]>section:not(.v-checked-autobtn)");
				let sectionsCount = sections.length;
				for (let i = 0; i < sectionsCount; i++) {
					let sectionElement = sections[i];
					sectionElement.querySelectorAll('.up-btn-z-auto').forEach(e => e.remove());

					let buttonAuto = document.createElement("button");
					buttonAuto.className = "up-btn up-btn-default up-btn-z-auto"
					buttonAuto.style.cssText = ""
					buttonAuto.innerText = "AUTO";
					buttonAuto.onclick = async function (e) {
						e.stopPropagation();

						let countryElementSmall = sectionElement.querySelector("[data-test=client-country]");
						let countryName = null;
						if (countryElementSmall) {
							let countryElementStrong = countryElementSmall.querySelector("strong");
							countryName = countryElementStrong.innerText;
						}

						const jobTitle = sectionElement.querySelector(".job-tile-title .up-n-link").innerText.trim();
						const jobDescription = sectionElement.querySelector("[data-test=job-description-text]").innerText
						const jobUrl = sectionElement.querySelector(".job-tile-title .up-n-link").href;
						let startIndex = jobUrl.indexOf("~");
						if (startIndex == -1) console.error("jobId not found: " + jobUrl);
						let endIndex = jobUrl.indexOf("/", startIndex);
						const jobId = endIndex == -1 ? jobUrl.substring(startIndex) : jobUrl.substring(startIndex, endIndex);

						let proposalTypes = window.getProposalTypes(jobTitle, jobDescription, false);
						let proposalTypeInput = "";
						if (proposalTypes && proposalTypes.length)
							proposalTypeInput = `${proposalTypes[0].title}`;
						while (true) {
							proposalTypeInput = prompt("", proposalTypeInput);
							if (!proposalTypeInput) return;
							proposalTypes = window.getProposalTypes(proposalTypeInput.split("/")[0], false, false);
							if (proposalTypes && proposalTypes.length) break;
						}
						try {
							const summaryResponse = await fetch(`/job-details/jobdetails/api/job/${jobId}/summary`, {
								headers: {
									"x-requested-with": "XMLHttpRequest",
								},
							});
							if (summaryResponse.status == 403 || summaryResponse.status == 404) {
								const labelAuto = document.createElement("label");
								labelAuto.className = "up-label-auto up-label-auto-outline";
								// labelAuto.style.cssText = "";
								labelAuto.innerText = `${summaryResponse.status}`;
								sectionElement.querySelector(".job-tile-title").parentElement.appendChild(labelAuto);
								return;
							}
							const summaryData = await summaryResponse.json();
							const countryFromSummary = summaryData.buyer.location.country;
							const questionCount = summaryData.job.questions.length;
							if (window.checkCountryBan(countryFromSummary) && !confirm(`${countryFromSummary}: Banned country, Continue?`)) {
							} else if (questionCount) {
								const labelAuto = document.createElement("label");
								labelAuto.className = "up-label-auto up-label-auto-outline";
								// labelAuto.style.cssText = "";
								labelAuto.innerText = `❓ +${questionCount} questions`;
								sectionElement.querySelector(".job-tile-title").parentElement.appendChild(labelAuto);
							} else {
								let preference = parseInt(proposalTypeInput.split("/")[1]) || 0;
								let channel = getNextChannel();
								for (let i = 0; i < proposalTypes.length; i++) {
									const proposalType = proposalTypes[i];
									if (!preference || preference == proposalType.preference) {
										await submitProposal(jobId, countryName, proposalType.profile, proposalType.proposalId, undefined, jobTitle, countryFromSummary, proposalType.priority, proposalType.channel || channel, 0, (labelAuto) => {
											sectionElement.querySelector(".job-tile-title").parentElement.appendChild(labelAuto);
										});
									}
								}
							}
							// buttonAuto.remove();
						} catch (error) {
							console.log(error);
						}
						// buttonAuto.innerText = "...";
						// buttonAuto.disabled = true;
					}
					sectionElement.querySelector(".job-tile-title").appendChild(buttonAuto);
					sectionElement.classList.add("v-checked-autobtn");
				}
			}
			if (window.AUTO_ENABLED) {
				let sections = document.querySelectorAll("[data-test=job-tile-list]>section:not(.v-checked-autoapply)");
				let sectionsCount = sections.length;
				let sectionsCheckedCount = 0;
				sections.forEach(
					(el) => el.classList.add('v-checked-autoapply')
				);
				for (let i = 0; i < sectionsCount; i++) {
					try {
						let sectionElement = sections[i];
						sectionsCheckedCount++;

						let countryElementSmall = sectionElement.querySelector("[data-test=client-country]");
						let countryName = null;
						if (countryElementSmall) {
							let countryElementStrong = countryElementSmall.querySelector("strong");
							countryName = countryElementStrong.innerText;
						}
						if (window.checkCountryBan(countryName))
							continue;
						let budgetElement = sectionElement.querySelector("[data-test=job-type]");
						let budget = budgetElement.innerText.trim().replaceAll(/,/g, '');
						if (budget.includes("Fixed"))
							budget = budgetElement.parentElement.innerText.trim().replaceAll(/,/g, '');
						let budgetMin = 0, budgetMax = 0;
						if (budget.split("$")[1]) budgetMin = parseInt(budget.split("$")[1]);
						if (budget.split("$")[2]) budgetMax = parseInt(budget.split("$")[2]);
						if (budgetMin && budgetMin < 10 && !budgetMax || budgetMax && budgetMax < 15)
							continue;
						if (budget.includes("Fixed") && budgetMin && budgetMin < 500)
							continue;

						const jobTitle = sectionElement.querySelector(".job-tile-title .up-n-link").innerText.trim();
						const jobDescription = sectionElement.querySelector("[data-test=job-description-text]").innerText
						const jobUrl = sectionElement.querySelector(".job-tile-title .up-n-link").href;
						let startIndex = jobUrl.indexOf("~");
						if (startIndex == -1) console.error("jobId not found: " + jobUrl);
						let endIndex = jobUrl.indexOf("/", startIndex);
						const jobId = endIndex == -1 ? jobUrl.substring(startIndex) : jobUrl.substring(startIndex, endIndex);
						const proposalTypes = window.getProposalTypes(jobTitle, jobDescription, true);
						if (proposalTypes && proposalTypes.length) {
							const summaryResponse = await fetch(`/job-details/jobdetails/api/job/${jobId}/summary`, {
								headers: {
									"x-requested-with": "XMLHttpRequest",
								},
							});
							if (summaryResponse.status == 403 || summaryResponse.status == 404) {
								const labelAuto = document.createElement("label");
								labelAuto.className = "up-label-auto up-label-auto-outline";
								// labelAuto.style.cssText = "";
								labelAuto.innerText = `${summaryResponse.status}`;
								sectionElement.querySelector(".job-tile-title").parentElement.appendChild(labelAuto);
								continue;
							}
							const summaryData = await summaryResponse.json();
							const countryFromSummary = summaryData.buyer.location.country;
							const questionCount = summaryData.job.questions.length;
							if (window.checkCountryBan(countryFromSummary)) {
								const labelAuto = document.createElement("label");
								labelAuto.className = "up-label-auto up-label-auto-outline";
								// labelAuto.style.cssText = "";
								labelAuto.innerText = `${countryFromSummary}`;
								sectionElement.querySelector(".job-tile-title").parentElement.appendChild(labelAuto);
							} else if (questionCount) {
								const labelAuto = document.createElement("label");
								labelAuto.className = "up-label-auto up-label-auto-outline";
								// labelAuto.style.cssText = "";
								labelAuto.innerText = `❓ +${questionCount} questions`;
								sectionElement.querySelector(".job-tile-title").parentElement.appendChild(labelAuto);
							} else {
								let channel = getNextChannel();
								for (let i = 0; i < proposalTypes.length; i++) {
									const proposalType = proposalTypes[i];
									if (window.PRE.includes(proposalType.preference)) {
										await submitProposal(jobId, countryName, proposalType.profile, proposalType.proposalId, undefined, jobTitle, countryFromSummary, proposalType.priority, proposalType.channel || channel, 1, (labelAuto) => {
											sectionElement.querySelector(".job-tile-title").parentElement.appendChild(labelAuto);
										});
									}
								}
							}
						}
					} catch (error) {
						console.warn(error);
					}
				}
				if (sectionsCheckedCount > 0 || sectionsCount > 0)
					console.log(`auto checked: ${sectionsCheckedCount} / ${sectionsCount}`);
			}
			await new Promise(resolve => setTimeout(resolve, 3000));
		}
		console.log("End last loop: " + new Date(t).toLocaleString());
	} else {
		if (window["last_t"])
			window[window["last_t"]] = false;
		let t = new Date().getTime();
		window["last_t"] = t;
		window[t] = t;

		window.since_id = window.since_id || 0;
		window.job_ts = window.job_ts || 0;

		while (window[t]) {
			try {
				const response0 = await fetch(`https://www.upwork.com/ab/find-work/api/feeds/saved-searches?since_id=${window.since_id}&job_ts=${window.job_ts}&paging=0%3B0`, {
					"headers": {
						"x-odesk-user-agent": "oDesk LM",
						"x-requested-with": "XMLHttpRequest",
						"x-upwork-accept-language": "en-US"
					},
					"method": "GET",
					"mode": "cors",
					"credentials": "include"
				});
				if (response0.status == 401) {
					console.log(`[${new Date().toLocaleTimeString()}]  Opening upwork page for 401 Error...`);
					let newTab = window.open('https://www.upwork.com/nx/find-work/', '_blank');
					await new Promise(resolve => setTimeout(resolve, window.AUTO_INTERVAL));
					newTab && newTab.close();
					continue;
				}
				if (!response0.ok)
					throw new Error(`Bad response0: ${response0.status}`);
				const data0 = await response0.json();
				if (!window.job_ts) {
					if (data0.paging && data0.paging.resultSetTs) {
						window.job_ts = data0.paging.resultSetTs;
						console.log(`[${new Date().toLocaleTimeString()}]  job_ts = ${window.job_ts}`);
					}
				} else if (data0.paging && data0.paging.total) {
					console.log(`pagingTotal = ${data0.paging.total},  since_id = ${window.since_id},  job_ts = ${window.job_ts}`);
					for (let i = tryCount = 0; tryCount < 10; tryCount++) {
						await new Promise(resolve => setTimeout(resolve, 1000));
						const response20 = await fetch(`https://www.upwork.com/ab/find-work/api/feeds/saved-searches?since_id=${window.since_id}&job_ts=${window.job_ts}&paging=0%3B50`, {
							"headers": {
								"x-odesk-user-agent": "oDesk LM",
								"x-requested-with": "XMLHttpRequest",
								"x-upwork-accept-language": "en-US"
							},
							"method": "GET",
							"mode": "cors",
							"credentials": "include"
						});
						if (!response20.ok)
							throw new Error(`Bad response20: ${response20.status}`);
						const data20 = await response20.json();
						let resultsCount = data20.results.length;
						if (resultsCount > 0) {
							window.job_ts = data20.paging.resultSetTs || window.job_ts;
							if (data20.results[0].recno)
								window.since_id = data20.results[0].recno;
							for (let i = 0; i < resultsCount; i++) {
								const el = data20.results[i];
								const countryName = el.client.location.country;
								if (window.checkCountryBan(countryName))
									continue;
								if (el.hourlyBudget.min && el.hourlyBudget.min < 10 && !el.hourlyBudget.max || el.hourlyBudget.max && el.hourlyBudget.max < 15)
									continue;
								if (el.amount.amount && el.amount.amount < 500)
									continue;
								const jobTitle = el.title;
								const jobDescription = el.description;
								const jobId = el.ciphertext;
								const proposalTypes = window.getProposalTypes(jobTitle, jobDescription, true);
								if (proposalTypes && proposalTypes.length) {
									const summaryResponse = await fetch(`/job-details/jobdetails/api/job/${jobId}/summary`, {
										headers: {
											"x-requested-with": "XMLHttpRequest",
										},
									});
									if (summaryResponse.status == 403 || summaryResponse.status == 404) continue;
									const summaryData = await summaryResponse.json();
									const countryFromSummary = summaryData.buyer.location.country;
									const questionCount = summaryData.job.questions.length;
									if (window.checkCountryBan(countryFromSummary)) {
										console.log(`[${new Date().toLocaleTimeString()}]  ${jobId} / ${countryFromSummary} / ${jobTitle}`);
									} else if (questionCount) {
										console.log(`[${new Date().toLocaleTimeString()}]  ${jobId} / +${questionCount} questions / ${jobTitle}`);
									} else {
										let channel = getNextChannel();
										for (let i = 0; i < proposalTypes.length; i++) {
											const proposalType = proposalTypes[i];
											await submitProposal(jobId, countryName, proposalType.profile, proposalType.proposalId, undefined, jobTitle, countryFromSummary, proposalType.priority, proposalType.channel || channel, 1);
										}
									}
								}
							}
							break;
						} else {
							console.log(`resultsCount = ${resultsCount}, try = ${++tryCount}`)
						}
					}
				} else {
					console.log(`pagingTotal = ${data0.paging.total},  since_id = ${window.since_id},  job_ts = ${window.job_ts}`);
				}
			} catch (error) {
				console.warn('Error:', error);
			}
			await new Promise(resolve => setTimeout(resolve, window.AUTO_INTERVAL));
		}
		console.log("End last loop: " + new Date(t).toLocaleString());
	}
}, window.AUTO_INTERVAL);

window.checkCountryBan = function (countryName) {
	if (!countryName) return false;
	// if (countryName == "United States" || countryName == "Canada" || countryName == "Australia" || countryName == "Qatar" || countryName == "Brazil") return false;
	// if (countryName == "United Kingdom" || countryName == "France" || countryName == "Switzerland" || countryName == "Sweden" || countryName == "United Arab Emirates") return false;
	if (countryName == "India" || countryName == "Pakistan" || countryName == "Bangladesh" || countryName == "Nigeria" || countryName == "South Korea"
		|| countryName == "Ukraine" || countryName == "Kazakhstan" || countryName == "Serbia")
		return true;
	return false;
}

window.checkTitleBan = function (jobTitleLowerCase) {
	if (jobTitleLowerCase.startsWith("do not apply ") || jobTitleLowerCase.startsWith("[$"))
		return jobTitleLowerCase;
	const banList = [/* " tutor", " teach", " guide", " assist", " consult", " support", " lead", "troubleshoot",*/
		" ionic ", " unity ", " unreal ", " zoho ", " youtube ", " tiktok ", " reddit ", " spotify ", " facebook ", " linkedin ", " twitter ", " instagram ", " pinterest ", " whatsapp ", /*" social",*/ 
		" airtable ", " notion ", " salesforce ", " squarespace ", " zenddesk ", " hubspot ",
		" filemaker ", " sharepoint ", " moodle ", " odoo ", " kajabi ", " thinkific ",
		" graphic design", " graphite design", "webassembly", "web assembly",
		" devops ", " dev ops ", " kubernetes ", " voip ", " streaming ", " mulesoft ", " gsap ",
		" tradingview ", " pinescript ", " metatrader ", " mt4 ", " mt5 ",
		" framer ", " terraform ", " quickbooks ", " monday.com ", " playwright ",
		" cheap ", " low budget ", " budget is low ",
		/*" power automate ", " zapier ", " make.com ",*/ " podio ", " unbounce ", " xano "];
	for (var i in banList)
		if (` ${jobTitleLowerCase} `.includes(banList[i])) return banList[i];
	return false;
}

window.getProposalTypes = function (jobTitle, jobDescription, checkBan) {
	if (!jobTitle) {
		console.log("jobTitle is null.");
		return;
	}
	jobTitle = jobTitle.replaceAll(/[\,\/\-\~\!\?–]/g, " ").replace(/\.+$/, "").replaceAll(/\s\s+/g, " ").toLowerCase();
	if (checkBan && checkTitleBan(jobTitle)) return;
	if (jobTitle.includes("webflow"))
		return [
			{ preference: 1, title: "webflow", profile: "webflow-2", proposalId: "webflow-8", channel: 0, priority: 3 },
			{ preference: 2, title: "webflow", profile: "webflow", proposalId: "webflow-7", channel: 0, priority: 2 },
		];
	if (jobTitle.includes("shopify"))
		return [
			{ preference: 1, title: "shopify", profile: "ecommerce", proposalId: "shopify-8", channel: 0, priority: 3 },
			{ preference: 2, title: "shopify", profile: "shopify", proposalId: "shopify-7", channel: 0, priority: 2 },
		];
	if (jobTitle.includes("bubble"))
		return [
			{ preference: 1, title: "shopify", profile: "ecommerce", proposalId: "bubble-1", channel: 0, priority: 1 },
			{ preference: 2, title: "shopify", profile: "shopify", proposalId: "bubble-2", channel: 0, priority: 1 },
		];
	if (jobTitle.includes("wordpress") || jobTitle.includes("word press") || jobTitle.includes("woocommerce") || ` ${jobTitle} `.includes(" divi ") || jobTitle.includes("elementor") || jobTitle.includes("wix"))
		return [
			{ preference: 1, title: "wordpress", profile: "laravel-ruby", proposalId: "wordpress-2", channel: 0, priority: 3 },
			{ preference: 2, title: "wordpress", profile: "wp-django", proposalId: "wordpress-1", channel: 0, priority: 2 },
		];
	if (jobTitle.includes("commerce"))
		return [
			{ preference: 1, title: "ecommerce", profile: "shopify", proposalId: "ecommerce-8", channel: 0, priority: 2 },
			{ preference: 2, title: "ecommerce", profile: "ecommerce", proposalId: "ecommerce-7", channel: 0, priority: 1 },
		];
	if (jobTitle.includes("laravel") || jobTitle.includes("php") || jobTitle.includes("codeigniter") || jobTitle.includes("cpanel"))
		return [
			{ preference: 1, title: "laravel", profile: "node-php", proposalId: "laravel-2", channel: 0, priority: 1 },
			{ preference: 2, title: "laravel", profile: "laravel-ruby", proposalId: "laravel-1", channel: 0, priority: 1 },
		];
	if (jobTitle.includes("web3") || jobTitle.includes("web 3") || jobTitle.includes("web-3") || jobTitle.includes("blockchain") || jobTitle.includes("solidity")
		|| jobTitle.includes("ethereum") || jobTitle.includes("polygon") || jobTitle.includes("rust") || jobTitle.includes("golang") || jobTitle.includes("go") || jobTitle.includes("nft")
		|| jobTitle.includes("smartcontract") || jobTitle.includes("smart contract")
		|| jobTitle.includes("wallet") && (jobTitle.includes("crypto") || jobTitle.includes("connect")))
		return [
			{ preference: 1, title: "web3 / blockchain", profile: "blockchain-2", proposalId: "blockchain-5", channel: 0, priority: 2 },
			{ preference: 2, title: "web3 / blockchain", profile: "blockchain", proposalId: "blockchain-4", channel: 0, priority: 2 }
		];
	if (jobTitle.includes("django") || jobTitle.includes("flask"))
		return [
			{ preference: 1, title: "database", profile: "laravel-ruby", proposalId: "full-stack-1", channel: 0, priority: 3 },
			{ preference: 2, title: "django", profile: "wp-django", proposalId: "django-flask-1", channel: 0, priority: 1 }
		];
	if (` ${jobTitle} `.includes(" ruby ") || ` ${jobTitle} `.includes(" rails "))
		return [
			{ preference: 1, title: "ruby on rails", profile: "laravel-ruby", proposalId: "ruby-1", channel: 0, priority: 1 }
		];
	if (` ${jobTitle} `.includes(" spring ") || jobTitle.includes("java") && (jobTitle.includes("web") || jobTitle.includes("backend") || jobTitle.includes("back end") || jobTitle.includes("fullstack") || jobTitle.includes("full stack")))
		return [
			{ preference: 1, title: "java spring", profile: "java-cs", proposalId: "java-spring-1", channel: 0, priority: 2 }
		];
	if (jobTitle.includes("backend") || jobTitle.includes("database") || jobTitle.includes("api development") || jobTitle.includes("api"))
		return [
			{ preference: 1, title: "backend", profile: "laravel-ruby", proposalId: "api-integration-database-1", channel: 0, priority: 3 },
			{ preference: 2, title: "backend", profile: "wp-django", proposalId: "api-integration-database-2", channel: 0, priority: 3 }
		];
	if (jobTitle.includes("asp.net"))
		return [
			{ preference: 1, title: "asp.net", profile: "java-cs", proposalId: "asp-1", channel: 0, priority: 1 }
		];
	if (jobTitle.includes("react") || jobTitle.includes("next") || jobTitle.includes("gatsby") || jobTitle.includes("mern") || jobTitle.includes("angular") || jobTitle.includes("mean"))
		return [
			{ preference: 1, title: "react", profile: "node-php", proposalId: "react-5", channel: 0, priority: 2 },
			{ preference: 2, title: "fullstack", profile: "javascript", proposalId: "react-4", channel: 0, priority: 2 },
		];
	if (jobTitle.includes("vue") || jobTitle.includes("nuxt") || jobTitle.includes("mevn"))
		return [
			{ preference: 1, title: "vue", profile: "node-php", proposalId: "vue-5", channel: 0, priority: 2 },
			{ preference: 2, title: "fullstack", profile: "javascript", proposalId: "full-stack-5", channel: 0, priority: 2 },
		];
	if (jobTitle.includes("svelte"))
		return [
			{ preference: 1, title: "svelte", profile: "node-php", proposalId: "svelte-5", channel: 0, priority: 2 },
			{ preference: 2, title: "fullstack", profile: "javascript", proposalId: "svelte-4", channel: 0, priority: 2 },
		];
	if (jobTitle.includes("javascript"))
		return [
			{ preference: 1, title: "svelte", profile: "node-php", proposalId: "laravel-1", channel: 0, priority: 3 },
			{ preference: 2, title: "fullstack", profile: "javascript", proposalId: "full-stack-1", channel: 0, priority: 2 },
		];
	if (jobTitle.includes("api integration") || jobTitle.includes("graphql") || jobTitle.includes("query") || jobTitle.includes("prisma"))
		return [
			{ preference: 1, title: "node", profile: "laravel-ruby", proposalId: "api-integration-database-1", channel: 0, priority: 3 },
			{ preference: 2, title: "node", profile: "wp-django", proposalId: "api-integration-database-2", channel: 0, priority: 3 }
		];
	if (` ${jobTitle} `.includes(" node") || ` ${jobTitle} `.includes(" express") || ` ${jobTitle} `.includes(" nest") || jobTitle.includes("typescript"))
		return [
			{ preference: 1, title: "node", profile: "node-php", proposalId: "node-5", channel: 0, priority: 3 },
			{ preference: 2, title: "node", profile: "wp-django", proposalId: "node-4", channel: 0, priority: 3 }
		];
	if (jobTitle.includes("chrome") && jobTitle.includes("extension") || jobTitle.includes("shopify extension"))
		return [
			{ preference: 1, title: "chrome extension", profile: "frontend", proposalId: "chrome-extension-7", channel: 0, priority: 2 },
		];
	if (jobTitle.includes("build responsive"))
		return [
			{ preference: 1, title: "frontend", profile: "frontend-2", proposalId: "frontend-8", channel: 0, priority: 3 },
			{ preference: 2, title: "frontend", profile: "frontend", proposalId: "frontend-7", channel: 0, priority: 3 }
		];
	if (jobTitle.includes("mongo") || jobTitle.includes("mysql") || jobTitle.includes("postgresql") || jobTitle.includes("supabase") || jobTitle.includes("oracle"))
		return [
			{ preference: 1, title: "database", profile: "laravel-ruby", proposalId: "database-mongodb-1", channel: 0, priority: 3 },
			{ preference: 2, title: "fullstack", profile: "node-php", proposalId: "api-integration-database-1", channel: 0, priority: 2 },
		];
	if (jobTitle.includes("web development") || jobTitle.includes("website development") || jobTitle.includes("webpage development"))
		return [
			{ preference: 1, title: "node", profile: "node-php", proposalId: "full-stack-2", channel: 0, priority: 3 },
			{ preference: 2, title: "fullstack", profile: "laravel-ruby", proposalId: "web-development-1", channel: 0, priority: 2 },
		];
	if (jobTitle.includes("fullstack") || jobTitle.includes("full stack") || jobTitle.includes("full-stack"))
		return [
			{ preference: 1, title: "fullstack", profile: "javascript", proposalId: "full-stack-2", channel: 0, priority: 2 },
			{ preference: 2, title: "fullstack", profile: "laravel-ruby", proposalId: "full-stack-5", channel: 0, priority: 2 },
		];
	if (jobTitle.includes("web developer"))
		return [
			{ preference: 1, title: "fullstack", profile: "javascript", proposalId: "web-development-1", channel: 0, priority: 2 },
			{ preference: 2, title: "fullstack", profile: "laravel-ruby", proposalId: "full-stack-5", channel: 0, priority: 2 },
		];
	if (jobTitle.includes("landing page"))
		return [
			{ preference: 1, title: "frontend", profile: "frontend-2", proposalId: "frontend-8", channel: 0, priority: 3 },
			{ preference: 2, title: "frontend", profile: "frontend", proposalId: "frontend-7", channel: 0, priority: 3 }
		];
	if (jobTitle.includes("design") || jobTitle.includes("designer"))
		return [
			{ preference: 1, title: "frontend", profile: "frontend-2", proposalId: "design-1", channel: 0, priority: 3 },
			{ preference: 2, title: "frontend", profile: "frontend", proposalId: "design-2", channel: 0, priority: 3 }
		];
	if (jobTitle.includes("frontend") || jobTitle.includes("front end") || jobTitle.includes("responsive") || ` ${jobTitle} `.includes(" css ") || jobTitle.includes("figma to html") || jobTitle.includes("figma"))
		return [
			{ preference: 1, title: "frontend", profile: "frontend-2", proposalId: "frontend-8", channel: 0, priority: 2 },
			{ preference: 2, title: "frontend", profile: "frontend", proposalId: "frontend-7", channel: 0, priority: 3 }
		];
	if (` ${jobTitle} `.includes(" web ") || ` ${jobTitle} `.includes(" site ") || jobTitle.includes("webpage") || jobTitle.includes("fullstack developer") 
	|| jobTitle.includes("full stack developer") || jobTitle.includes("website") || jobTitle.includes("developer") || jobTitle.includes("dashboard") 
	|| jobTitle.includes("landing") || jobTitle.includes("portal") || jobTitle.includes("backend") || jobTitle.includes("back end") || jobTitle.includes("app") 
	|| jobTitle.includes("web developer") || jobTitle.includes("fullstack") || jobTitle.includes("full stack") || jobTitle.includes("bug") || jobTitle.includes("fix")
	|| jobTitle.includes("integration") || jobTitle.includes("design") || jobTitle.includes("design") || jobTitle.includes("build responsive") || jobTitle.includes("software") || jobTitle.includes("engineer") || jobTitle.includes("dapp") || jobTitle.includes("blockchain")
	|| jobTitle.includes("build") || jobTitle.includes("responsive") || jobTitle.includes("database") || jobTitle.includes("development") || jobTitle.includes("integration") || jobTitle.includes("website") || jobTitle.includes("solidity") 
	|| jobTitle.includes("smart contract") || jobTitle.includes("application") || jobTitle.includes("api") || jobTitle.includes("next") || jobTitle.includes("nest")
	|| jobTitle.includes("vue") || jobTitle.includes("react") || jobTitle.includes("angular") || jobTitle.includes("framework") || jobTitle.includes("project")
	|| jobTitle.includes("html") || jobTitle.includes("laravel") || jobTitle.includes("ecommerce") || jobTitle.includes("nft") || jobTitle.includes("node") 
	|| jobTitle.includes("mobile") || jobTitle.includes("webapplication") || jobTitle.includes("home page") || jobTitle.includes("wordpress") || jobTitle.includes("wp") || jobTitle.includes("dashboard") || jobTitle.includes("sql") 
	|| jobTitle.includes("supabase") || jobTitle.includes("restaurant") || jobTitle.includes("python") || jobTitle.includes("django") || jobTitle.includes("typescript") ||jobTitle.includes("css") || jobTitle.includes("frontend")) {
		if (jobDescription) {
			jobDescription = jobDescription.replaceAll(/[\,\/\-\~\!\?–]/g, " ").replace(/\.+$/, "").replaceAll(/\s\s+/g, " ").toLowerCase();
			if (jobDescription.includes("bubble"))
				return [
					{ preference: 1, title: "shopify", profile: "ecommerce", proposalId: "bubble-1", channel: 0, priority: 1 },
					{ preference: 2, title: "shopify", profile: "shopify", proposalId: "bubble-2", channel: 0, priority: 1 },
				];
			if (jobDescription.includes("webflow"))
				return [
					{ preference: 1, title: "webflow", profile: "webflow-2", proposalId: "webflow-8", channel: 0, priority: 3 },
					{ preference: 2, title: "webflow", profile: "webflow", proposalId: "webflow-7", channel: 0, priority: 2 },
				];
			if (jobDescription.includes("shopify"))
				return [
					{ preference: 1, title: "shopify", profile: "ecommerce", proposalId: "shopify-8", channel: 0, priority: 3 },
					{ preference: 2, title: "shopify", profile: "shopify", proposalId: "shopify-7", channel: 0, priority: 2 },
				];
			if (jobTitle.includes("commerce"))
				return [
					{ preference: 1, title: "ecommerce", profile: "shopify", proposalId: "ecommerce-8", channel: 0, priority: 2 },
					{ preference: 2, title: "ecommerce", profile: "ecommerce", proposalId: "ecommerce-7", channel: 0, priority: 1 },
				];
			if (jobDescription.includes("web3") || jobDescription.includes("web 3") || jobDescription.includes("blockchain") || jobDescription.includes("solidity")
				|| jobDescription.includes("ethereum") || jobDescription.includes("polygon") || ` ${jobDescription} `.includes(" rust ") || ` ${jobDescription} `.includes(" nft ")
				|| jobDescription.includes("smartcontract") || jobDescription.includes("smart contract")
				|| jobDescription.includes("wallet") && (jobDescription.includes("crypto") || jobDescription.includes("connect")))
				return [
					{ preference: 1, title: "web3 / blockchain", profile: "blockchain-2", proposalId: "blockchain-5", channel: 0, priority: 3 },
					{ preference: 2, title: "web3 / blockchain", profile: "blockchain", proposalId: "blockchain-4", channel: 0, priority: 2 }
				];
			if (jobDescription.includes("laravel") || jobDescription.includes("php") || jobDescription.includes("codeigniter") || jobDescription.includes("cpanel"))
				return [
					{ preference: 1, title: "laravel", profile: "wp-django", proposalId: "laravel-2", channel: 0, priority: 3 },
					{ preference: 2, title: "node", profile: "laravel-ruby", proposalId: "laravel-1", channel: 0, priority: 3 }
				];
			if (jobDescription.includes("django") || jobDescription.includes("flask"))
				return [
					{ preference: 1, title: "database", profile: "laravel-ruby", proposalId: "full-stack-1", channel: 0, priority: 3 },
					{ preference: 2, title: "django", profile: "wp-django", proposalId: "django-flask-1", channel: 0, priority: 1 }
				];
			if (jobDescription.includes("wordpress") || jobDescription.includes("word press") || jobDescription.includes("woocommerce") || ` ${jobDescription} `.includes(" divi ") || jobDescription.includes("elementor"))
				return [
					{ preference: 1, title: "wordpress", profile: "wp-django", proposalId: "wordpress-1", channel: 0, priority: 1 },
					{ preference: 2, title: "wordpress", profile: "node-php", proposalId: "wordpress-2", channel: 0, priority: 3 },
				];
			if (` ${jobDescription} `.includes(" ruby ") || ` ${jobDescription} `.includes(" rales "))
				return [
					{ preference: 1, title: "ruby on rails", profile: "laravel-ruby", proposalId: "ruby-1", channel: 0, priority: 3 }
				];
			if (` ${jobDescription} `.includes(" java ") || ` ${jobDescription} `.includes(" spring "))
				return [
					{ preference: 1, title: "java spring boot", profile: "java-cs", proposalId: "java-spring-1", channel: 0, priority: 2 }
				];
			if (jobDescription.includes("asp.net"))
				return [
					{ preference: 1, title: "asp.net", profile: "java-cs", proposalId: "asp-1", channel: 0, priority: 1 }
				];
			if (jobDescription.includes("backend") || jobDescription.includes("database") || jobDescription.includes("api development"))
				return [
					{ preference: 1, title: "node", profile: "laravel-ruby", proposalId: "full-stack-5", channel: 0, priority: 3 },
					{ preference: 2, title: "node", profile: "wp-django", proposalId: "java-spring-1", channel: 0, priority: 3 }
				];
			if (jobDescription.includes("mongo") || jobDescription.includes("mysql") || jobDescription.includes("postgresql") || jobDescription.includes("supabase") || jobDescription.includes("oracle"))
				return [
					{ preference: 1, title: "database", profile: "laravel-ruby", proposalId: "database-mongodb-1", channel: 0, priority: 3 },
					{ preference: 2, title: "fullstack", profile: "node-php", proposalId: "api-integration-database-1", channel: 0, priority: 2 },
				];
			if (jobDescription.includes("react") || jobDescription.includes("next") || jobDescription.includes("gatsby") || jobDescription.includes("mern"))
				return [
					{ preference: 1, title: "react", profile: "node-php", proposalId: "react-5", channel: 0, priority: 2 },
					{ preference: 2, title: "fullstack", profile: "javascript", proposalId: "react-4", channel: 0, priority: 2 },
				];
			if (jobTitle.includes("design") || jobTitle.includes("designer"))
				return [
					{ preference: 1, title: "frontend", profile: "frontend-2", proposalId: "design-1", channel: 0, priority: 3 },
					{ preference: 2, title: "frontend", profile: "frontend", proposalId: "design-2", channel: 0, priority: 3 }
				];
			if (jobDescription.includes("vue") || jobDescription.includes("nuxt") || jobDescription.includes("mevn"))
				return [
					{ preference: 1, title: "vue", profile: "node-php", proposalId: "vue-5", channel: 0, priority: 2 },
					{ preference: 2, title: "fullstack", profile: "javascript", proposalId: "vue-4", channel: 0, priority: 2 },
				];
			if (jobDescription.includes("svelte"))
				return [
					{ preference: 1, title: "svelte", profile: "node-php", proposalId: "svelte-5", channel: 0, priority: 2 },
					{ preference: 2, title: "fullstack", profile: "javascript", proposalId: "svelte-4", channel: 0, priority: 2 },
				];
			if (jobDescription.includes("javascript"))
				return [
					{ preference: 1, title: "svelte", profile: "node-php", proposalId: "laravel-1", channel: 0, priority: 3 },
					{ preference: 2, title: "frontend", profile: "frontend-2", proposalId: "frontend-8", channel: 0, priority: 3 },
				];
			if (jobDescription.includes("api integration") || jobDescription.includes("api") || jobDescription.includes("graphql") || jobDescription.includes("query") || jobDescription.includes("prisma"))
				return [
					{ preference: 1, title: "node", profile: "laravel-ruby", proposalId: "api-integration-database-1", channel: 0, priority: 3 },
					{ preference: 2, title: "node", profile: "wp-django", proposalId: "api-integration-database-2", channel: 0, priority: 3 }
				];
			if (jobDescription.includes("node") || jobDescription.includes("express") || jobDescription.includes("nest") || jobDescription.includes("typescript"))
				return [
					{ preference: 1, title: "node", profile: "node-php", proposalId: "node-5", channel: 0, priority: 3 },
					{ preference: 2, title: "node", profile: "wp-django", proposalId: "node-4", channel: 0, priority: 3 }
				];
			if (jobDescription.includes("chrome") && jobDescription.includes("extension") || jobDescription.includes("shopify extension"))
				return [
					{ preference: 1, title: "chrome extension", profile: "frontend", proposalId: "chrome-extension-7", channel: 0, priority: 2 },
					{ preference: 2, title: "fullstack", profile: "laravel-ruby", proposalId: "full-stack-5", channel: 0, priority: 2 }
				];
			if (jobDescription.includes("build responsive") || jobDescription.includes("ui") || jobDescription.includes("user interface"))
				return [
					{ preference: 1, title: "frontend", profile: "frontend-2", proposalId: "frontend-8", channel: 0, priority: 3 },
					{ preference: 2, title: "design", profile: "frontend", proposalId: "frontend-7", channel: 0, priority: 3 }
				];
			if (jobDescription.includes("web development") || jobDescription.includes("website development") || jobDescription.includes("webpage development") || jobDescription.includes("saas") )
				return [
					{ preference: 1, title: "node", profile: "node-php", proposalId: "full-stack-2", channel: 0, priority: 3 },
					{ preference: 2, title: "fullstack", profile: "laravel-ruby", proposalId: "full-stack-5", channel: 0, priority: 2 }
				];
			if (jobDescription.includes("fullstack") || jobDescription.includes("full stack"))
				return [
					{ preference: 1, title: "fullstack", profile: "javascript", proposalId: "full-stack-1", channel: 0, priority: 2 },
					{ preference: 2, title: "fullstack", profile: "node-php", proposalId: "full-stack-4", channel: 0, priority: 2 }
				];
			if (jobDescription.includes("web developer"))
				return [
					{ preference: 1, title: "fullstack", profile: "javascript", proposalId: "full-stack-2", channel: 0, priority: 2 },
					{ preference: 2, title: "fullstack", profile: "laravel-ruby", proposalId: "full-stack-5", channel: 0, priority: 2 },
				];
			if (jobDescription.includes("landing page"))
				return [
					{ preference: 1, title: "frontend", profile: "frontend-2", proposalId: "frontend-8", channel: 0, priority: 3 },
					{ preference: 2, title: "design", profile: "frontend", proposalId: "frontend-7", channel: 0, priority: 3 }
				];
			if (jobDescription.includes("frontend") || jobDescription.includes("front end") || jobDescription.includes("responsive") || ` ${jobDescription} `.includes(" css ") || jobDescription.includes("figma to html") || jobDescription.includes("figma"))
				return [
					{ preference: 1, title: "frontend", profile: "frontend-2", proposalId: "frontend-8", channel: 0, priority: 2 },
					{ preference: 2, title: "design", profile: "frontend", proposalId: "frontend-7", channel: 0, priority: 3 }
				];
		}
		return [
			{ preference: 1, title: "fullstack", profile: "javascript", proposalId: "full-stack-1", channel: 0, priority: 3 },
			{ preference: 2, title: "fullstack", profile: "node-php", proposalId: "full-stack-4", channel: 0, priority: 2 },
		];
	}
}

window.submitProposal = async function (jobId, countryName, profile, proposalId, hourlyRate, jobTitle, jobCountry, priority, channel, preventOverwrite, callbackSuccess, callbackFailed) {
	if (!jobId) {
		console.log("jobId is null.");
		return false;
	}
	if (!profile) {
		console.log("profile is null.");
		return false;
	}
	if (!proposalId) {
		console.log("proposalId is null.");
		return false;
	}
	let proposal = window.myProposals[proposalId];
	if (!proposal) {
		console.log("No proposal found: " + proposalId);
		return false;
	}
	if (countryName == "United States")
		priority += 3;
	else if (countryName == "Canada" || countryName == "Australia" || countryName == "Qatar")
		priority += 2;
	else if (countryName == "United Kingdom" || countryName == "Switzerland" || countryName == "Sweden")
		priority += 1;
	console.log(`%c-- sending auto apply: ${proposalId} / ${jobId} / ${channel}`, 'color: #fe40ff');
	var proposalJson = {
		boost: 50,
		proposal: proposal,
		hourlyRate: hourlyRate || 25
	};
	try {
		const response = await fetch(`${window.SERVER_URL}/api/v2/apply/$/${profile}/${jobId}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				proposalJson: JSON.stringify(proposalJson, null, '\t'),
				jobTitle: jobTitle || "",
				jobCountry: jobCountry || "",
				priority: priority || "",
				channel: channel || window.CHANNEL || "",
				preventOverwrite: preventOverwrite
			})
		});
		const applyData = await response.json();
		console.log(applyData);
		if (applyData.success && applyData.already) {
			console.log(`%c[${new Date().toLocaleTimeString()}]  already applied: ${proposalId} / ${jobId} / ${channel}`, 'color: #fe40ff');
			const labelAuto = document.createElement("button");
			labelAuto.className = "up-label-auto";
			labelAuto.style.cssText = "background: #00adff80;";
			labelAuto.innerText = `👍 ${profile} / ${proposalId}`;
			labelAuto.title = `priority = ${applyData.priority || 0},  channel = ${applyData.channel || 0}`;
			labelAuto.onclick = function (e) {
				e.stopPropagation();
				if (!confirm(`Will cancel this application, Really?\n${jobTitle}\n${profile} / ${proposalId}`)) return;
				fetch(`${window.SERVER_URL}/api/v2/apply/$/${profile}/${jobId}/`, {
					method: 'DELETE'
				}).then((response) => {
					return response.json();
				}).then((deleteData) => {
					console.log(deleteData);
					if (deleteData.success) {
						console.log(`%c--- deleted apply: ${proposalId} / ${jobId}`, 'color: #fe40ff');
						labelAuto.remove();
					}
					else
						console.log(`%c--- failed to delete apply: ${proposalId} / ${jobId}\n${deleteData.error}`, 'color: #fe40ff');
				}).catch(error => {
					console.log(error);
				});
			}
			typeof callbackSuccess === "function" && callbackSuccess(labelAuto);
		}
		else if (applyData.success) {
			console.log(`%c[${new Date().toLocaleTimeString()}]  applied: ${proposalId} / ${jobId} / ${channel}`, 'color: #fe40ff');
			const labelAuto = document.createElement("button");
			labelAuto.className = "up-label-auto";
			labelAuto.style.cssText = "cursor: pointer;";
			labelAuto.innerText = `👍 ${profile} / ${proposalId}`;
			labelAuto.title = `priority = ${priority},  channel = ${channel}`;
			labelAuto.onclick = function (e) {
				e.stopPropagation();
				if (!confirm(`Will cancel this application, Really?\n${jobTitle}\n${profile} / ${proposalId}`)) return;
				fetch(`${window.SERVER_URL}/api/v2/apply/$/${profile}/${jobId}/`, {
					method: 'DELETE'
				}).then((response) => {
					return response.json();
				}).then((deleteData) => {
					console.log(deleteData);
					if (deleteData.success) {
						console.log(`%c--- deleted apply: ${proposalId} / ${jobId}`, 'color: #fe40ff');
						labelAuto.remove();
					}
					else
						console.log(`%c--- failed to delete apply: ${proposalId} / ${jobId}\n${deleteData.error}`, 'color: #fe40ff');
				}).catch(error => {
					console.log(error);
				});
			}
			typeof callbackSuccess === "function" && callbackSuccess(labelAuto);
		}
		else {
			console.error(`%c--- failed to auto apply: ${proposalId} / ${jobId} / ${channel}\n${applyData.error}`, 'color: #ffc107');
			typeof callbackFailed === "function" && callbackFailed();
		}
		return applyData;
	} catch (error) {
		console.log(error);
		return error;
	}
}


window.myProposals = {

	"asp-1": `Hello 👋👋👋
I am a highly skilled and experienced ASP.NET full-stack developer with 7+ years of experience. I have extensive experience in C# and ASP.NET. And also have experience in React/Vue/Node, Javascript/TypeScript, Web3, Tailwind CSS, REST API/GraphQL/WebSocket and so on.

As a full-stack developer, I have extensive experience in Backend and frontend development, database management, cloud management, web hosting, SEO and so on. I am confident in my ability to be helpful for any kind of your work.

Here are some of my past ASP.NET projects:

https://clubflyers.com    (C#/ASP.NET + Canvas + Fabric.js + Three.js)

https://creator.clubflyers.com/home/logocreator    (C#/ASP.NET + Vue + SVG + Canvas)

I am a dedicated and self-motivated professional with a strong attention to detail. I am also a good communicator and can collaborate effectively with remote teams.

I look forward to the opportunity to work with you.

Thank you.`,


	"full-stack-1": `Hello

I am a highly skilled and experienced full-stack engineer with 7+ years of experience. I have extensive experience in PHP/Laravel/WordPress, Node/Express/Nest, React/Next/Gatsby, Vue/Nuxt, Javascript/TypeScript, Tailwind CSS, REST API/GraphQL/WebSocket and so on. I mastered in W3C standard web protocols and mobile/responsive/browser sensitive design.

As a full-stack developer, I have extensive experience in Backend and frontend development, database management, cloud management, web hosting, SEO and so on. I am confident in my ability to be helpful for any kind of your work.

Here are some of my past projects:

- Hire captains online

https://thecaptapp.com    (Laravel + Vue + Bootstrap)

- Landing/Portal

https://www.zuut.co    (React + Next + Node + Express + MaterialUI + Firebase + Vercel)

https://maison.work    (React + Next + Node + Express + MaterialUI + Heroku)

https://ndb.money    (React + Gatsby + AWS Amplify)

- Food booking & delivery:

https://fitfoodfresh.com    (WordPress + React + Reveal + Bootstrap)

- DeFi/NFT/Web3

https://farmhero.io    (React + Web3)

https://wizard.financial    (React + Bootstrap + Web3)

https://studio.manifold.xyz    (Vue + Tailwind CSS + Web3)

https://dragonkart.com    (Vue + Nuxt + Node + Express + Tailwind CSS + Web3)

I am a dedicated and self-motivated professional with a strong attention to detail. I am also a good communicator and can collaborate effectively with remote teams.
I look forward to the opportunity to work with you.
Thank you.`,


	"java-spring-1": `Hello 👈👈👈

I am a highly skilled and experienced Java full-stack developer with 7+ years of experience. I have extensive experience in Java, Kotlin, Spring Framework, Spring Boot, Hibernate, Maven/Gradle, CI/CD, Microservice, Kubernetes, Docker and so on. And also have experience in React/Next/Gatsby, Vue/Nuxt, Javascript/TypeScript, Node/Express/Nest, Web3, Tailwind CSS, REST API/GraphQL/WebSocket and so on.

As a full-stack developer, I have extensive experience in Backend and frontend development, database management, cloud management, web hosting, SEO and so on. I am confident in my ability to be helpful for any kind of your work.

WWW.NYYU.IO is one of my past similar project that I built using Java, Spring Boot, Oracle database and AWS Elastic Beanstalk.

https://www.nyyu.io    (Spring Boot + React + Gatsby + GraphQL + Oracle Database + AWS)

I am a dedicated and self-motivated professional with a strong attention to detail. I am also a good communicator and can collaborate effectively with remote teams.

I look forward to the opportunity to work with you.

Thank you.`,


	"laravel-1": `
Hello, 👍👍

I am a highly skilled and experienced PHP developer with over 7 years of expertise. My proficiency lies in PHP and Laravel, and I also possess extensive knowledge in React/Next/Gatsby, Vue/Nuxt, Javascript/TypeScript, Node/Express/Nest, Tailwind CSS, REST API/GraphQL/WebSocket, and more. I have mastered W3C standard web protocols and excel in mobile-responsive and browser-sensitive design.

As a full-stack developer, I have a wealth of experience in both backend and frontend development, including database management, cloud management, web hosting, SEO, and other related areas. I am confident in my ability to assist with any type of work you require.

Allow me to highlight a few of my past projects:

Hire captains online

Website: thecaptapp.com

Technologies used: Laravel, Vue, Bootstrap

Vitamin Shop

Website: vitawake.co.uk

Technologies used: Laravel, Wix

Sport Tournament

Website: padelintour.com

Technologies used: Laravel, Tailwind CSS

I am a dedicated and self-motivated professional with a keen eye for detail. Effective communication and seamless collaboration with remote teams are among my strengths.

I eagerly anticipate the opportunity to work with you.

Thank you.`,


	"django-flask-1": `Hello 👋👋👋👋👋👋👋👋👋👋👋👋

I am a highly skilled and experienced Python developer with 3+ years of experience. I have extensive experience in Python, Django and Flask. And also have experience in React/Next/Gatsby, Vue/Nuxt, Javascript/TypeScript, Node/Express/Nest, Tailwind CSS, REST API/GraphQL/WebSocket and so on. I mastered in W3C standard web protocols and mobile/responsive/browser sensitive design.

As a full-stack developer, I have extensive experience in Backend and frontend development, database management, cloud management, web hosting, SEO and so on. I am confident in my ability to be helpful for any kind of your work.

I am a dedicated and self-motivated professional with a strong attention to detail. I am also a good communicator and can collaborate effectively with remote teams.

I look forward to the opportunity to work with you.

Thank you.`,


	"ruby-1": `Hello 👍👍👍👍👍👍👍👍👍👍👍👍👍👍
I am an experienced Ruby on Rails developer with 3+ years of expertise. My skills extend to React/Next/Gatsby, Vue/Nuxt, JavaScript/TypeScript, Node/Express/Nest, Tailwind CSS, REST API/GraphQL/WebSocket, and more. I have a strong command of W3C web protocols and mobile-responsive design.

With extensive experience in backend and frontend development, database management, cloud management, web hosting, and SEO, I am confident in my ability to assist with any project.

Here are some of my past projects:

Marketplace for Hotel Reservations: roomertravel.com (Ruby on Rails)

Coffee Supply Chain Platform: crema.co (Ruby on Rails + Vue)

Events Management System: eventstaffing.co.uk (Ruby on Rails)

As a dedicated and detail-oriented professional, I excel in communication and remote team collaboration.

I am excited about the opportunity to work with you.

Thank you`,


	"wordpress-1": `Hello 👋👋👋👋👋👋👋👋👋👋👋👋👋👋👋

I am a highly skilled and experienced WordPress developer with 7+ years of experience. I have extensive experience in PHP, WordPress and WooCommerce. And I am excellent in frontend development including HTML/CSS, Javascript, React/Vue and Responsive Design. I mastered in W3C standard web protocols and mobile/responsive/browser sensitive design. I am confident in my ability to be helpful for any kind of your work.

As a full-stack developer, I have extensive experience in Backend and frontend development, database management, cloud management, web hosting, SEO and so on.

Here are some of my past projects:

https://abandonedempress.com    (WordPress + Bootstrap)

https://uldfire.com    (WordPress + Divi)

https://4dmain.com    (WordPress + Elementor)

https://everythingcartagena.com    (WordPress + WooCommerce + Divi + Bootstrap)

https://cojinmimos.com    (WordPress + WooCommerce + Elementor)

https://www.mydoctorspick.com    (WordPress + WooCommerce + Elementor + Vue)

I am a dedicated and self-motivated professional with a strong attention to detail. I am also a good communicator and can collaborate effectively with remote teams.

I look forward to the opportunity to work with you.

Thank you.`,


	"full-stack-2": `Hi. 👍👍👍👍👍👍👍👍👍👍👍👍👍👍
	As an experienced web developer with expertise in both frontend and backend development, I believe I am an ideal candidate for this project.

Over the years, I have honed my skills in creating responsive and visually appealing user interfaces using modern frontend technologies such as HTML, CSS, JavaScript, React, Vue, Tailwind CSS etc. Additionally, my proficiency in backend development with languages like PHP, Python, Javascript and frameworks like Laravel, WordPress, Django, Express enables me to build robust and scalable web applications.

You can check my past projects here:

- Company/Service Portal

https://pichler.pro    (Laravel)

https://dankmemer.lol    (React + Next + Node)

- Betting:

https://www.bsmma.com    (Laravel + Vue)

- Vitamin Shop

https://www.vitawake.co.uk    (Laravel + Wix)

- Tire Shop

https://zohr.com    (React + Bootstrap + Ruby on Rails + Heroku)

- CMS/Ecommerce

https://uldfire.com    (WordPress + Divi)

https://4dmain.com    (WordPress + Elementor)

https://www.kcg-vet.com    (WordPress + WooCommerce + Elementor)

https://everythingcartagena.com    (WordPress + WooCommerce + Divi + Bootstrap)

My attention to detail, strong problem-solving abilities, and passion for clean and efficient code make me a valuable asset to any development team. Understanding the importance of effective communication, I am committed to maintaining open and regular communication throughout the project's lifecycle. I am responsive to feedback and will actively collaborate with you to ensure your vision is brought to life.

I am confident that my technical skills and experience align perfectly with your project requirements. I am eager to discuss the project further and demonstrate how my expertise can contribute to its success. Thank you for considering my proposal.

Looking forward to the possibility of working together.

Best regards`,

	"design-1": `Hi, ❤❤❤❤❤❤❤❤❤❤❤❤.
	As a seasoned graphic designer with over 8 years of experience in logo design, UX/UI design and graphic design.

I understand that you're seeking a designer, and I believe my technical skills, creativity, and passion for design make me an excellent candidate for your project. I am confident in my ability to translate your ideas into visually appealing designs that will enhance your brand image while effectively communicating your message to your target audience.

In my previous roles, I have:

Developed creative graphics and visual layouts for a wide range of clients, delivering unique and impactful designs.

Worked closely with clients to understand their vision, preferences, and goals to provide thoughtful, impactful design solutions.

Completed projects successfully and on time, often under tight deadlines without compromising the quality of work.

I am proficient in the use of Adobe Creative Suite (including Photoshop, Illustrator, InDesign) and other design tools. I strive to keep up with the latest design trends and continuously improve my skills to deliver up-to-date designs.

I invite you to take a look at my portfolio here: 

https://miata.io/

https://meditation-pro.vercel.app/

https://xd.adobe.com/view/ad184190-cf88-4e53-904c-b0e5fa86cd5a-f84b/

https://xd.adobe.com/view/d627495b-e070-468d-b56b-8b2bdd946494-8374/

https://xd.adobe.com/view/e18c6364-9cbc-4a62-b9a6-6eb994cb65dd-b4df/

https://xd.adobe.com/view/bc4ace5e-1e5e-4df0-9cb7-5a77653ea53f-e919/

Should you choose to work with me, my priority will be to deliver a design that not only meets your expectations but also surpasses them. I look forward to the possibility of working together and am ready to start right away.

Thank you for considering my bid. I hope to discuss the project further with you soon.

Best Regards`,

	"design-2": `Hi, 🙏🙏🙏🙏🙏🙏🙏🙏🙏.
As an experienced designer adept at UI/UX designer, I'm confident in my ability to bring your vision to life.

My past designs:
 
 https://www.figma.com/file/DCZhjQdV7RviW8oZKeexWH/%5BClient%5D-Zheng_website-in-figma?type=design&node-id=0-1  
				 
 https://xd.adobe.com/view/f4d75fb3-e0e3-4387-95e2-00504d6c8da9-a184/screen/a341817d-cd77-43ca-b891-3bf2354667c1/

 https://xd.adobe.com/view/e18c6364-9cbc-4a62-b9a6-6eb994cb65dd-b4df/

I'm skilled in Adobe Creative Suite and continuously adapt to new design trends.

Looking forward to potentially collaborating with you and delivering designs that not only meet but exceed your expectations.

Best Regards`,

	"laravel-2": `Hi ,👈👈👈👈👈👈👈👈👈👈👈👈

As a highly skilled PHP developer with expertise in Laravel and Vue/React, I am confident in my ability to deliver exceptional results for your project. With years of experience in Laravel, I have successfully built and maintained robust, scalable, and secure web applications. Additionally, my proficiency in Vue and React enables me to create dynamic and interactive user interfaces that enhance the overall user experience.

Here are some of my notable past projects:

Company/Service Portal

Website: pichler.pro

Technologies used: Laravel

Betting Platform

Website: bsmma.com

Technologies used: Laravel, Vue

Video Ad Management

Website: openmedialogic.com

Technologies used: Laravel, Bootstrap, Three.js

I prioritize effective communication throughout the project, ensuring regular and transparent updates. I am responsive to feedback and committed to understanding and fulfilling your specific requirements.

With my technical skills, attention to detail, and problem-solving abilities, I am confident that I am the ideal candidate for your project. I am eager to discuss the project in more detail and showcase how my expertise can contribute to its success.

Thank you for considering my proposal. I look forward to the opportunity to work with you.

Best regards`,


	"wordpress-2": `Hi.
As an experienced WordPress developer with a strong background in various themes and plugins, I believe I possess the skills and expertise necessary to successfully complete your project.

Throughout my career, I have worked extensively with WordPress, developing custom themes and implementing plugins to meet clients' unique requirements. I am well-versed in HTML, CSS, and PHP, allowing me to create visually stunning and functional websites.

With a keen eye for detail, I ensure that every project I undertake is responsive, user-friendly, and optimized for search engines. Whether it's customizing existing themes or developing bespoke solutions, I am committed to delivering high-quality work that exceeds expectations.

You can check my past WordPress here:

https://tmsfirst.com    (WordPress + Bootstrap)

https://www.basquiat.com    (WordPress + Divi)

https://hyperkodes.com    (WordPress + Elementor)

https://www.kcg-vet.com    (WordPress + WooCommerce + Elementor)

I pride myself on effective communication and collaboration with clients. I am confident in my ability to meet your deadlines while maintaining the highest quality standards.

I would be delighted to discuss your project further. Thank you for considering my proposal, and I look forward to the opportunity to collaborate with you.

Best regards`,


	"blockchain-4": `Hello 🙏🙏🙏🙏🙏🙏🙏🙏🙏🙏🙏🙏
As a highly skilled and experienced Web3/Blockchain developer, I am excited to offer my expertise for your project. With a solid background in Web3/Blockchain development, including Web3, Smart Contracts, Solidity, and NFTs, I am well-versed in the latest technologies and practices in this field. Additionally, I have extensive experience in modern Web/Web3 technologies such as React/Next/Gatsby, Vue/Nuxt, JavaScript/TypeScript, Node/Express/Nest, Tailwind CSS, REST API/GraphQL/WebSocket, and more.

As a full-stack developer, I possess a wealth of experience in both backend and frontend development, database management, cloud management, web hosting, SEO, and other related areas. I am confident in my ability to provide valuable assistance for any kind of work you require.

Allow me to highlight a few of my past Web3/Blockchain projects:

DeFi Platform

Website: farmhero.io

Technologies used: React, Web3

NFT Mint & Marketplace

Website: wizard.financial

Technologies used: React, Bootstrap, Web3

NFT Mint Platform

Website: studio.manifold.xyz

Technologies used: Vue.js, Tailwind CSS, Web3

NFT Game

Website: dragonkart.com

Technologies used: Vue, Nuxt, Node, Tailwind CSS, Web3

I am a dedicated and self-motivated professional with a keen eye for detail. Meeting project deadlines and delivering high-quality work are my top priorities. Effective communication and seamless collaboration with remote teams are among my strengths.

I am excited about the possibility of working with you and contributing to the success of your project.

Thank you.`,


	"react-4": `Hello,

I am a highly skilled ReatJS developer with extensive experience in a wide range of technologies including React, Next, Gatsby, JavaScript, TypeScript, Node, Express, Nest, Tailwind CSS, REST API, GraphQL, WebSocket, and more. With my expertise in both backend and frontend development, database management, cloud management, web hosting, and SEO, I am confident in my ability to provide valuable assistance for any kind of project.

Here are some of my notable past projects:

Grow Builder - A web application developed using React, Next, Node, Express, MaterialUI, Firebase, and deployed on Vercel.  https://www.zuut.co 

Office Rent - A web platform built with React, Next, Node, Express, MaterialUI, and hosted on Heroku.  https://maison.work

Company/Service Portal - Developed using React, Gatsby, and AWS Amplify, this project includes two portals: https://ndb.money and https://ndb.technology.

Token Sale/Auction Service - A comprehensive platform created with Spring Boot, React, Gatsby, GraphQL, Oracle Database, and hosted on AWS.  https://www.nyyu.io

As a dedicated and self-motivated professional, I pay strong attention to detail and possess excellent communication skills. I am adept at collaborating effectively with remote teams, ensuring seamless project execution.

I am excited about the opportunity to work with you and contribute my expertise to your project. Please feel free to reach out to discuss your requirements further.

Thank you.`,


	"node-4": `Hi , 🤝🤝🤝🤝🤝🤝🤝🤝🤝🤝🤝🤝🤝🤝🤝🤝🤝🤝.

I hope this message finds you well. I am writing to express my interest in working with you as a Node.js developer. With my extensive experience in Node.js, Express, TypeScript, and database management, I am confident in my ability to contribute to your project.

As a Node.js developer, I have successfully completed several projects in the past, showcasing my expertise in building scalable and efficient backend systems. Here is an example of my work:

Token Sale/Auction Service - I developed a comprehensive platform using Node.js, Express, GraphQL, and Oracle Database. This platform facilitated secure token sales and auctions, providing a seamless experience for users. The project involved implementing complex business logic, integrating with external APIs, and ensuring high performance and security. https://www.zuut.co , https://maison.work , 

I am dedicated, self-motivated, and pay great attention to detail. I believe effective communication is crucial, and I am skilled at collaborating with remote teams. I am confident that my skills and experience make me a valuable asset for your project.

Thank you for considering my bid. I look forward to the opportunity to work with you.`,


	"vue-4": `Hello, 👌👌👌👌👌👌👌👌👌👌👌👌👌👌👌👌👌👌👌👌

I am a highly skilled Vue.js developer with extensive experience in Vue.js, JavaScript/TypeScript, and frontend development. I have a strong background in building robust and scalable web applications using Vue.js and its ecosystem.

As a frontend developer, I specialize in Vue.js and have a deep understanding of its core concepts and best practices. I have successfully delivered projects using Vue.js, creating responsive and user-friendly interfaces, implementing complex UI/UX designs, and optimizing performance for a seamless user experience.

Here are some of my past projects that showcase my skills in Vue.js:

The Capt App - Built with Vue.js and Bootstrap.

Studio Manifold - Developed using Vue.js and Tailwind CSS.

Dragon Kart - Created with Vue.js and Nuxt.js.

I am dedicated, self-motivated, and pay strong attention to detail. I am an excellent communicator and have experience collaborating effectively with remote teams. I am confident in my ability to contribute to frontend development tasks and provide valuable insights and solutions.

If you choose to work with me, you can expect a highly skilled and reliable frontend developer who is committed to delivering high-quality code and meeting project deadlines. I am excited about the possibility of working together and bringing your frontend vision to life.

Thank you for considering my bid. I look forward to discussing the project further and answering any questions you may have.`,


	"svelte-4": `Hello ✨

I am a highly skilled svelte developer with extensive experience in Svelte/SvelteKit, Javascript/TypeScript, Node/Express/Nest, Tailwind CSS, REST API/GraphQL/WebSocket and so on.

As a full-stack developer, I have extensive experience in Backend and frontend development, database management, cloud management, web hosting, SEO and so on. I am confident in my ability to be helpful for any kind of your work.

I am a dedicated and self-motivated professional with a strong attention to detail. I am also a good communicator and can collaborate effectively with remote teams.

I look forward to the possibility of working with you.

Thank you.`,


	"full-stack-4": `Hi, 👌👌👌👌👌👌👌

I hope this proposal finds you well. I am thrilled to submit my application for your website development project. As a highly skilled and experienced Full Stack Developer, I believe I am the perfect fit for your project.

With 8+ years of industry experience, I have successfully delivered numerous web development projects, showcasing my expertise in both front-end and back-end technologies. I am proficient in HTML, CSS, JavaScript, and have a strong command over popular frameworks such as React and Vue.

My approach to website development is centered around creating user-friendly, responsive, and visually appealing websites that align with the client's requirements. I am adept at designing intuitive user interfaces and implementing robust functionality to ensure seamless user experiences.

I understand the importance of clear and effective communication in project collaboration. I will maintain regular communication throughout the development process, providing updates and addressing any concerns promptly.

Moreover, I am committed to delivering projects on time and within the agreed budget, while maintaining high standards of code quality and security. I am confident in my ability to meet your project's objectives and exceed your expectations.

I would love the opportunity to discuss your project in more detail and provide you with a comprehensive plan tailored to your specific needs. Thank you for considering my application, and I look forward to the possibility of working together.

These are my past projects:

https://moooi.com

https://localadventure.mammut.com

https://discoveredfoods.com

https://ripeplanet.com

Best regards`,


	"react-5": `Hi. 👈👈👈👈👈👈👈👈

As an experienced JavaScript expert with expertise in React/Next.js and MERN stacks(MongoDB, Express.js, React, Node.js), I am confident in my ability to deliver exceptional results for your project.

With a strong background in both frontend and backend development, I possess the skills necessary to build robust and scalable web applications. My experience with the MERN stacks allows me to develop efficient and interactive user interfaces using React and Next/Gatsby, while also implementing server-side functionalities using various backend stacks such as Node/Express/Nest, PHP/Laravel, Python/Django and so on.

You can check my past projects here:

https://vavato.com    (React + Next + Node)

https://farmhero.io    (React + Web3)

https://wizard.financial    (React + Bootstrap + Web3)

https://www.fieldworktracker.com    (Django + React + Stripe)

https://www.onthesnow.com    (Django + React + Next + Node)

Effective communication is crucial for project success, and I prioritize regular and transparent communication with my clients. I am responsive to feedback, seek clarification when needed, and provide progress updates to ensure we are aligned throughout the development process.

I take great pride in my problem-solving skills and adaptability, allowing me to tackle challenges effectively and deliver innovative solutions. I am dedicated to providing the highest quality of work while maintaining efficiency and cost-effectiveness.

I would be thrilled to discuss your project further and showcase my portfolio of successful JavaScript projects developed using the React and MERN stacks. Thank you for considering my proposal, and I look forward to the opportunity to collaborate with you.

Best regards`,


	"node-5": `Hi. 👋👋👋👋👋👋👋👋👋👋👋👋
As an experienced node.js developer with expertise in React, Vue, and Node, I am confident in my ability to deliver exceptional results for your project.

With a strong background in frontend and backend development, I possess the skills necessary to create dynamic and engaging web applications. I have extensive experience in developing responsive user interfaces using React and Vue, ensuring seamless user experiences across different devices and platforms.

Furthermore, my proficiency in Node.js enables me to build robust server-side applications, implement RESTful APIs, and work with databases such as MongoDB and PostgreSQL. I prioritize writing clean, modular, and maintainable code to ensure the scalability and longevity of the projects I work on.

Effective communication is a priority for me, and I am committed to keeping you informed, seeking feedback, and collaborating closely to achieve your project goals. I take great pride in my problem-solving skills and adaptability, enabling me to address challenges effectively and deliver innovative solutions. I am dedicated to providing the highest quality of work while maintaining efficiency and cost-effectiveness.

I would be thrilled to discuss your project in more detail. Thank you for considering my proposal, and I look forward to the opportunity to collaborate with you.

Best regards`,


	"vue-5": `Hi. 👋👋👋👋👋👋👋👋👋👋👋👋
As an experienced Vue.js developer with expertise in Vue and MEVN (MongoDB, Express.js, Vue.js, Node.js) stacks, I am confident in my ability to deliver exceptional results for your project.

With a strong background in both frontend and backend development, I possess the skills necessary to build robust and scalable web applications. My experience with the MEVN stacks allows me to develop efficient and interactive user interfaces using Vue and Nuxt, while also implementing server-side functionalities using various backend stacks such as Node/Express/Nest, PHP/Laravel, Ruby on Rails and so on.

You can check my past projects here:

https://www.bsmma.com    (Laravel + Vue.js)

https://crema.co    (Ruby on Rails + Vue)

https://weddingexpo.co    (Ruby on Rails + Vue)

Effective communication is crucial for project success, and I prioritize regular and transparent communication with my clients. I am responsive to feedback, seek clarification when needed, and provide progress updates to ensure we are aligned throughout the development process.

I take great pride in my problem-solving skills and adaptability, allowing me to tackle challenges effectively and deliver innovative solutions. I am dedicated to providing the highest quality of work while maintaining efficiency and cost-effectiveness.

I would be thrilled to discuss your project further and showcase my portfolio of successful JavaScript projects developed using Vue and MEVN stacks. Thank you for considering my proposal, and I look forward to the opportunity to collaborate with you.

Best regards`,


	"svelte-5": `Hi.👋👋👋👋👋👋👋👋👋👋👋👋

I am an experienced JavaScript developer. With several years of experience in web development, I am confident that I have the skills and expertise needed to complete this project successfully.

As a Svelte developer, I have worked on various projects ranging from simple landing pages to complex web applications. I am proficient in HTML, CSS, JavaScript and TypeScript, and have a strong understanding of front-end development.

I am committed to delivering high-quality work that meets your expectations and requirements. I am available to start immediately and look forward to discussing this opportunity further.

Thank you for considering my proposal.`,


	"blockchain-5": `Hi. As an experienced individual blockchain developer, I have the skills and expertise required to successfully complete your project.

With 3 years of experience in blockchain technology, including decentralized applications (dApps), smart contracts, and blockchain protocols like Ethereum and Hyperledger, I am well-versed in the latest industry trends and best practices.

My services include smart contract development, dApp development, tokenization and ICO development, blockchain integration, smart contract auditing, and blockchain consulting.

I prioritize clear communication and collaboration to ensure that your specific requirements are met and that you are updated on the progress and milestones.

I am dedicated to delivering high-quality work within agreed-upon timelines, and I possess strong problem-solving and analytical skills to overcome any challenges that may arise during development.

I offer my expertise in designing and developing secure and efficient smart contracts using Solidity, Rust, Python, Cairo or other programming languages.

I can build intuitive user interfaces for dApps and implement seamless interactions with the blockchain. I am excellent in modern frontend development including React and Web3.

If you need assistance with token creation and ICO development, I can guide you through the process while ensuring compliance with relevant regulations and industry best practices.

I am available for a call to discuss your project in more detail or to provide any additional information you may require.

Thank you for considering my proposal. I am excited about the opportunity to work with you and contribute to the success of your blockchain project.`,


	"full-stack-5": `Hi. ✨✨✨✨✨✨✨✨✨
I am a skilled Full Stack Developer with 7+ years of experience and a proven track record of delivering successful web development projects.

Here's why I believe I am the right fit for your project:

- Experience: With expertise in front-end and back-end technologies, I have worked on various web development projects across different industries.

- Technical Proficiency: I am proficient in HTML5, CSS3, JavaScript, React, Vue, PHP, Python, Node.js, MySQL, and MongoDB.

- Customized Solutions: I will create a tailored website that reflects your brand identity and engages your target audience effectively.

- Timely Delivery: I am committed to delivering your project on schedule without compromising quality.

- Strong Communication: I maintain open and transparent communication, ensuring your project's success.

Thank you for considering my proposal. I look forward to discussing the project further. Kindly let me know the next steps.

Best regards`,


	"ecommerce-7": `Hello 👋👋👋👋👋👋👋👋👋👋

I am a highly skilled and experienced Ecommerce developer with 5+ years of experience. I have extensive experience in Shopify and Ecommerce Website development. And I am excellent in frontend development including HTML/CSS, Javascript, React/Vue and Responsive Design. I mastered in W3C standard web protocols and mobile/responsive/browser sensitive design.

As a full-stack developer, I have extensive experience in Backend and frontend development, database management, cloud management, web hosting, SEO and so on. I am confident in my ability to be helpful for any kind of your work.

Here are some of my past projects:

- Wall Art Shop

https://www.americanflat.com    (Shopify)

- Baby Pillow Shop

https://www.mimospillow.ca    (Shopify)

- Hire captains online

https://thecaptapp.com    (Laravel + Vue.js + Bootstrap)

- Hire maid online:

https://www.maidfinder.sg    (CodeIgnitor + Webflow + Bootstrap)

- Food booking & delivery:

https://fitfoodfresh.com    (WordPress + React + Reveal + Bootstrap)

- Tire Shop

https://zohr.com    (React + Ruby on Rails + Heroku)

I am a dedicated and self-motivated professional with a strong attention to detail. I am also a good communicator and can collaborate effectively with remote teams.

I look forward to the possibility of working with you.

Thank you.`,


	"frontend-7": `Hello ✨✨✨✨✨

I am a highly skilled and experienced frontend developer with 7+ years of experience. I have extensive experience in React/Next/Gatsby, Vue/Nuxt, Javascript/TypeScript, Node/Express/Nest, Tailwind CSS, REST API/GraphQL/WebSocket, SEO and so on.

I mastered in W3C standard web protocols and mobile/responsive/browser sensitive design.

I am confident in my ability to be helpful for any kind of your work.

Here are some of my past projects:

- Company/Service Portal

https://www.zuut.co    (React + Next + MaterialUI + Node + Firebase + Vercel)

https://ndb.technology    (React + Gatsby + AWS Amplify)

https://ndb.money    (React + Gatsby + AWS Amplify)

- Hire captains online

https://thecaptapp.com    (Laravel + Vue.js + Bootstrap)

- Food booking & delivery:

https://fitfoodfresh.com    (WordPress + React + Reveal + Bootstrap)

- DeFi & NFT

farmhero.io    (React + Web3)

wizard.financial    (React + Bootstrap + Web3)

https://studio.manifold.xyz    (Vue.js + Tailwind CSS + Web3)

dragonkart.com    (Vue + Nuxt + Node + Tailwind CSS + Web3)

- Online drawing & desinging

https://clubflyers.com    (C#/ASP.NET + Canvas + Fabric.js + Three.js)

https://creator.clubflyers.com/home/logocreator    (C#/ASP.NET + Vue.js + SVG + Canvas)

I am a dedicated and self-motivated professional with a strong attention to detail. I am also a good communicator and can collaborate effectively with remote teams.

I look forward to the opportunity to work with you.

Thank you.`,


	"shopify-7": `Hello 👋👋👋👋👋👋👋👋👋👋

I am a highly skilled and experienced Shopify developer with 4+ years of experience. I have extensive experience in Shopify/Shopify Plus development, API integration, theme customization, Response design, and so on. And I am excellent in frontend development including HTML/CSS, Javascript, React/Vue and Responsive Design. I mastered in W3C standard web protocols and mobile/responsive/browser sensitive design.

As a full-stack developer, I have extensive experience in Backend and frontend development, database management, cloud management, web hosting, SEO and so on. I am confident in my ability to be helpful for any kind of your work.

Here are some of my past Shopify projects:

- Wall Art Shop

https://www.americanflat.com    (Shopify)

- Baby Pillow Shop

https://www.mimospillow.ca    (Shopify)

I am a dedicated and self-motivated professional with a strong attention to detail. I am also a good communicator and can collaborate effectively with remote teams.

I look forward to the possibility of working with you.

Thank you.`,


	"webflow-7": `Hello 👋👋👋👋👋👋👋👋
I am a highly skilled and experienced Webflow developer. I have strong background and solid experience in Webflow and HTML/CSS. I have extensive experience in building landing page and Ecommerce websites. I mastered in W3C standard web protocols and mobile/responsive/browser sensitive design. I am confident in my ability to be helpful for any kind of your work.

You can check my past Webflow projects:

https://www.converge.net

https://www.experiencefutures.org

https://fairdealmarketing.com

I am a dedicated and self-motivated professional with a strong attention to detail. I am also a good communicator and can collaborate effectively with remote teams.

I look forward to the opportunity to work with you.

Thank you.`,


	"chrome-extension-7": `Hello 👋👋👋👋👋👋👋👋👋
I am an experienced Chrome Extension developer interested in your project. With a strong background in JavaScript, HTML, CSS, and the Chrome Extension API, I am confident in my ability to meet your requirements effectively.

As an experienced front-end developer, I have extensive experience in HTML/CSS, Javascript/TypeScript, React/Vue/Node, Tailwind CSS, REST API/GraphQL/WebSocket and so on.

I am a dedicated and self-motivated professional with a strong attention to detail. I am also a good communicator and can collaborate effectively with remote teams.

I look forward to the opportunity to work with you.

Thank you.`,


	"frontend-8": `Hi.👋👋👋👋👋👋👋👋👋👋👋👋
As an experienced individual frontend developer, I possess the skills and expertise required to successfully complete your project.

With 6+ years of experience, I am proficient in HTML, CSS, JavaScript, and modern frontend frameworks like React and Vue.

My services include UI/UX design implementation, frontend development for dynamic and interactive web applications, and mobile optimization for seamless user experiences on smartphones and tablets.

I ensure cross-browser compatibility, making your website functional across all major web browsers.

My code is clean, efficient, and optimized for performance to provide a fast and smooth user experience.

You can check my past projects here:

- Gaming Coaching Platform

https://skoonova.com    (React + Next + Node + Tailwind CSS)

- Grow Builder

https://www.zuut.co    (React + Next + Node + MaterialUI + Firebase + Vercel)

- Office Rent

https://maison.work    (React + Next + Node + MaterialUI + Heroku)

- Car Subscription Platform

https://www.carify.com    (Vue + Nuxt)

I prioritize effective communication and collaboration throughout the project, using project management tools like Trello or Jira.

I am dedicated to delivering high-quality work within deadlines, and I have strong problem-solving abilities.

I would be happy to discuss your project further or answer any questions you may have. Please feel free to reach out at your convenience.

Thank you for considering my proposal. I look forward to the opportunity to work with you and bring your project to life.`,


	"ecommerce-8": `Hi.✨✨✨✨✨✨✨✨✨✨✨✨

I am an experience developer with a strong background in ecommerce development and extensive experience in building ecommerce, Shopify, WordPress websites, I possess the skills necessary to create visually appealing, user-friendly, and high-performing online stores.

Throughout my career, I have successfully completed numerous ecommerce projects, earning positive feedback from clients for my technical expertise, attention to detail, and ability to meet project deadlines. I am dedicated to delivering exceptional quality work while ensuring the highest level of customer satisfaction.
		
Effective communication is paramount, and I prioritize regular and transparent communication with my clients. I am responsive to feedback, seek clarification when needed, and provide progress updates to ensure we are aligned throughout the development process.
		
I am well-versed in ecommerce best practices, including SEO optimization, inventory management, and integration with third-party applications. I am also experienced in migrating existing stores to Shopify or WordPress and providing ongoing maintenance and support.
		
I take great pride in my problem-solving skills and attention to detail, allowing me to identify and resolve issues efficiently. I am committed to delivering projects that meet your specific requirements and exceed your expectations.
		
I would be delighted to discuss your project further and showcase my portfolio of successful ecommerce projects. Thank you for considering my proposal, and I look forward to the opportunity to collaborate with you.
		
Best regards`,


	"shopify-8": `Hi 👈👈👈👈👈👈👈👈👈. 

I am an experience developer with a strong background in Shopify development and extensive experience in building ecommerce websites, I possess the skills necessary to create visually appealing, user-friendly, and high-performing online stores. I am proficient in customizing Shopify themes, implementing payment gateways, and optimizing the overall shopping experience for customers.

Throughout my career, I have successfully completed numerous Shopify projects, earning positive feedback from clients for my technical expertise, attention to detail, and ability to meet project deadlines. I am dedicated to delivering exceptional quality work while ensuring the highest level of customer satisfaction.

Effective communication is paramount, and I prioritize regular and transparent communication with my clients. I am responsive to feedback, seek clarification when needed, and provide progress updates to ensure we are aligned throughout the development process.

I am well-versed in ecommerce best practices, including SEO optimization, inventory management, and integration with third-party applications. I am also experienced in migrating existing stores to Shopify and providing ongoing maintenance and support.

You can check my past Shopify projects here:

- Bambinos Baby Food Shop & Delivery

https://bambinosbabyfood.com    (Shopify)

- Poster Design

https://racedayprints.com    (Shopify + Printful + PageFly)

I take great pride in my problem-solving skills and attention to detail, allowing me to identify and resolve issues efficiently. I am committed to delivering projects that meet your specific requirements and exceed your expectations.

I would be delighted to discuss your project further and showcase my portfolio of successful Shopify and ecommerce projects. Thank you for considering my proposal, and I look forward to the opportunity to collaborate with you.

Best regards`,


	"webflow-8": `Hi. 🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟

Very excited to submit my proposal for your Webflow project. As a webflow specialist, I have extensive experience in creating visually stunning and highly functional websites using this platform.

My approach to web design is centered around understanding your unique needs and creating a custom solution that exceeds your expectations. Whether you need a simple landing page or a complex e-commerce site, I have the expertise to deliver a website that not only looks great but also performs well.

I am excellent in Responsive Design, modern frontend development and SEO. And also experienced in Figma.

In addition to my technical skills, I am also committed to providing exceptional customer service. I understand the importance of clear communication and timely delivery, and I always strive to exceed my clients' expectations.

Here are some of my past Webflow projects:

https://visitDays.com

https://usernurture.com

https://goodbits.io

https://www.cymonz.com

I look forward to the opportunity to work with you on your Webflow project.

Thank you.`,


	"scraping-9": `Hi. I am an experienced web developer and web scraper. As an experienced programmer with a deep understanding of web protocol and data extraction, I am confident in my ability to meet and exceed your expectations for this project.

I have successfully completed numerous web scraping projects, gathering data from various sources such as websites, APIs, and online directories. My expertise includes using Python, C# and Javascript based scraping frameworks such as Selenium, Puppeteer, BeautifulSoup, Scrapy, HtmlAgilityPack, as well as leveraging advanced techniques like dynamic content handling and anti-bot measures.

With your guidance, I will meticulously analyze the target website's structure and design a robust scraping strategy to ensure accurate and efficient data retrieval. I will also implement error handling mechanisms and establish data validation protocols to maintain the integrity and reliability of the extracted information.

"When you share a website, I will scrape everything that you want."

I am excited about the opportunity to work with you and demonstrate my expertise in web scraping. I look forward to further discussing the project and finding the best approach to achieve your desired outcomes. Thanks`,


"php-laravel-3" : `Hi 👋👋👋👋👋👋👋👋👋👋👋👋👋👋, client.

I am excited to apply for this Laravel-PHP Developer role after reading your post.

I've read in detail about your description for this role.

I am excited to express my interest in the Full Stack Developer position you have posted. With a passion for cutting-edge technology and API development and API integration, I believe I am well-suited for this project. I have extensive experience in both frontend and backend development, and I am eager to contribute to your innovative project.

I understand this role's responsible and also I can satisfy all of these requirements with my deep-experience in PHP/Vue.

There are some my previous work URL - PHP/(Vue).

Please take a moment to review them:

https://turn2me.ie

https://shinebrandseeds.com

I am familiar with Vue as well as Laravel to build productive web application.

I am a proactive Full-Stack Laravel\PHP Developer ready to dive into the world of Lead Management and Intelligence Gathering Software and contribute to your innovative project. 

I look forward to collaborating with your dedicated team of developers.

Thank you for considering my bid. I am eager to discuss further details and demonstrate how my skills and experience align with your project's requirements.` ,

	"automation-9": `Hi. 👋

As an experienced expert in this field, I have the skills and knowledge necessary to successfully complete your project.

With 5+ years of experience in web & desktop automation, I am proficient in using tools like Selenium WebDriver, Puppeteer, AutoIt, UiPath and Power Automate.

My services include web scraping, automated testing, task automation, desktop application automation, process automation, and custom script development.

I prioritize clear communication and collaboration throughout the project, ensuring that your specific requirements are met and that you are informed about the progress and milestones.

I am dedicated to delivering high-quality work within agreed-upon timelines, and I possess strong problem-solving and troubleshooting skills to overcome any challenges that may arise during the automation process.

I have a proven track record of designing scalable and maintainable automation solutions, ensuring long-term reliability and ease of maintenance.

I offer my expertise in automating repetitive tasks, extracting data from websites, and streamlining workflows to improve productivity and reduce manual errors.

If you would like to discuss your project in more detail or have any questions, please feel free to reach out. I am available for a call or to provide any additional information you may need.

I am eager to work with you and provide efficient and reliable desktop/web automation solutions. Thank you for considering my proposal.`,



	"bot-auto-9": `Hello ✨✨✨

I am an experienced programmer and automation expert. I have extensive experience in various kinds of automation works.

I am a dedicated and self-motivated professional with a strong attention to detail. I am confident in my ability to be helpful for any kind of your work.

I look forward to the possibility of working with you.

Thank you.`,

	"api-integration-database-1" : `Hi , there 😎.

I am an expert backend developer specializing in database API development. With a proven track record of delivering exceptional solutions, I am confident in my ability to meet your requirements and provide a robust and scalable backend solution.

Skills:

Backend development expertise

Database design and optimization proficiency

API development and seamless integration

Performance optimization techniques

Implementation of robust security measures

Thorough testing and meticulous debugging

Experience: With extensive experience spanning 7 years in backend development, I have successfully completed numerous projects, delivering efficient and reliable solutions. I possess comprehensive knowledge of various databases, including MySQL, PostgreSQL, MongoDB, and more.

Approach:

I immerse myself in understanding your requirements and project scope.

I craft an optimized database structure for efficient data storage and retrieval.

I can develop a secure and scalable API tailored precisely to your needs.

And conduct rigorous testing and meticulous debugging to ensure a flawless solution.

Will provide comprehensive documentation and ongoing support for seamless integration and future maintenance.

Timeline: Rest assured, I am committed to delivering top-notch work within the agreed-upon timeframe.

Portfolio: Please find examples of my previous work in my portfolio here.

https://www.misstravel.com

http://allpositions.ru

I am thrilled about the opportunity to work on this project and contribute my expertise to its success. Should you have any inquiries or wish to discuss further, please feel free to reach out. Thank you for considering my bid.

Best regards` ,

"api-integration-database-2" : `Greetings! 😎

As an accomplished backend developer specializing in database API development, I bring a wealth of expertise to the table. Throughout my career, I have consistently delivered exceptional solutions, and I am confident in my ability to meet your requirements with a robust and scalable backend solution.

My Skill Set:

🔹 Proficiency in backend development 🔹 Expertise in database design and optimization 🔹 Seamless integration of APIs 🔹 Implementation of performance optimization techniques 🔹 Strong focus on robust security measures 🔹 Thorough testing and meticulous debugging

Experience:

With a solid background spanning over 7 years in backend development, I have successfully completed numerous projects, consistently delivering efficient and reliable solutions. I possess comprehensive knowledge of various databases, including MySQL, PostgreSQL, MongoDB, and more.

My Approach:

🔸 I immerse myself in understanding your requirements and project scope. 🔸 I meticulously craft an optimized database structure for efficient data storage and retrieval. 🔸 I develop secure and scalable APIs tailored precisely to your needs. 🔸 Rigorous testing and meticulous debugging ensure a flawless solution. 🔸 I provide comprehensive documentation and ongoing support for seamless integration and future maintenance.

Timeline:

Rest assured, I am committed to delivering top-notch work within the agreed-upon timeframe.

Portfolio:

Please take a moment to explore my portfolio, which showcases examples of my previous work:

🔗 https://urdumaza.ca/chat/index.php

🔗 https://shop.goodhealthstore.in

🔗 https://www.drterrywillard.com

I am thrilled about the opportunity to work on this project and contribute my expertise to its success. If you have any inquiries or would like to discuss further, please feel free to reach out. Thank you for considering my bid.

Best regards.` ,

 "database-mongodb" : `

Greetings! 👋👋👋👋👋👋👋👋👋👋

I am an experienced backend developer specializing in database API development, bringing a wealth of expertise to the table. Throughout my career, I have consistently delivered exceptional solutions, and I am confident in my ability to meet your requirements with a robust and scalable backend solution.

Here is a summary of my skill set:

Proficiency in backend development

Expertise in database design and optimization

Seamless integration of APIs

Implementation of performance optimization techniques

Strong focus on robust security measures

Thorough testing and meticulous debugging

With over 7 years of experience in backend development, I have successfully completed numerous projects, consistently delivering efficient and reliable solutions. I possess comprehensive knowledge of various databases, including MySQL, PostgreSQL, MongoDB, and more.

My approach to projects involves the following steps:

Immersing myself in understanding your requirements and project scope.

Meticulously crafting an optimized database structure for efficient data storage and retrieval.

Developing secure and scalable APIs tailored precisely to your needs.

Conducting rigorous testing and meticulous debugging to ensure a flawless solution.

Providing comprehensive documentation and ongoing support for seamless integration and future maintenance.

Rest assured, I am committed to delivering top-notch work within the agreed-upon timeframe.

Please take a moment to explore my portfolio, which showcases examples of my previous work:

🔗 https://urdumaza.ca/chat/index.php

🔗 https://shop.goodhealthstore.in

🔗 https://www.drterrywillard.com

I am thrilled about the opportunity to work on this project and contribute my expertise to its success. If you have any inquiries or would like to discuss further, please feel free to reach out. Thank you for considering my bid.

Best regards.` ,
	
	"react-next-mern-1" : `Hi, there 👋👋👋👋👋👋👋👋👋👋👋👋.

As a talented web developer , I am appling on your project after reading your post.

In my previous role, I had the opportunity to work extensively with the React-Next-Gatsby - MERN stack. This stack allowed me to build modern and efficient web applications from front to back.

I utilized React as the core front-end library, leveraging its component-based architecture to create reusable UI elements and manage state effectively. With Next.js, I implemented server-side rendering (SSR) and static site generation (SSG) to improve performance and SEO optimization. This framework also facilitated automatic code splitting and routing, making development more efficient.

For static website development, I utilized Gatsby, which provided pre-rendering capabilities, optimized image loading, and seamless data fetching. This allowed me to build fast and scalable static websites with ease.

On the back end, I worked with the MERN stack, which stands for MongoDB, Express.js, React, and Node.js. I used MongoDB as the NoSQL database to store and retrieve data in a flexible JSON-like format. Express.js served as the web application framework, enabling me to handle HTTP requests and build APIs efficiently. Node.js acted as the runtime environment, allowing me to run JavaScript code on the server-side.

Please take a moment to review my previous works.

https://www.catgirl.io

https://www.misstravel.com

https://www.thecustommovement.com

Overall, my experience with the React-Next-Gatsby - MERN stack has equipped me with the skills to build full-stack web applications, optimize performance, and ensure a seamless user experience. I am confident in my ability to leverage these technologies to deliver high-quality solutions for your project.

Looking forward to hearing from you.

Best,` ,

	"web-development-1" : `Dear Hiring Manager,

I am writing to express my interest in the position of website developer for frontend and backend development at your company. With my strong skills and experience in this stack, I believe I would be a valuable asset to your team.

I have a solid background in frontend development, including proficiency in HTML, CSS, and JavaScript. I am well-versed in modern frontend frameworks such as React and Angular, and have a keen eye for design and user experience. I am confident in my ability to create visually appealing and responsive websites that meet the needs of clients and end-users.

In addition to frontend development, I also have extensive experience in backend development. I am skilled in programming languages such as Python, PHP, and Node.js, and have worked with various backend frameworks and technologies. I am proficient in database management systems like MySQL and MongoDB, and have a strong understanding of RESTful APIs and server-side development.

What sets me apart is my ability to seamlessly integrate frontend and backend technologies to create robust and efficient web applications. I have a deep understanding of the full development cycle, from conceptualization and design to implementation and deployment. I am comfortable working in both agile and waterfall development environments, and have a proven track record of delivering high-quality projects on time and within budget.

Furthermore, I am a highly collaborative team player who thrives in a fast-paced and dynamic work environment. I am always eager to learn and stay up-to-date with the latest industry trends and best practices. I am confident that my strong problem-solving skills, attention to detail, and ability to communicate effectively would make me a valuable addition to your development team.

Please take a moment to review my previous works.

https://www.catgirl.io

https://www.misstravel.com

https://www.thecustommovement.com

Thank you for considering my application. I would welcome the opportunity to discuss how my skills and experience align with your company's needs.

I look forward to the possibility of working with you.

Sincerely.`,

	"bubble-1": `Hi there, 👋

I hope you're doing well. I'm a professional Bubble.io developer with extensive experience in building robust and scalable web applications. I have a strong grasp of the Bubble.io platform, and I'm confident in my ability to deliver high-quality solutions to meet your specific requirements.

Past Projects:

Project 1: https://scottlaidler.com/ 

- I developed a dynamic e-commerce platform using Bubble.io, integrating payment gateways and ensuring a smooth user experience.

Project 2: https://www.danielgrindrod.com/ 

- I created a collaboration tool for a remote team, implementing real-time chat features, task management, and file sharing functionalities.

With my background in Bubble.io development and my passion for delivering outstanding results, I'm confident that I can contribute to your project's success. 

Here's what you can expect from me:

Expertise in Bubble.io: I am well-versed in utilizing the powerful features of Bubble.io to create intuitive and visually appealing web applications.

Custom Solutions: I strive to understand your unique business needs and tailor the applications accordingly, ensuring they align perfectly with your objectives.

Responsive Design: I will create web applications that are mobile-friendly, offering an optimal user experience across all devices.

Timely Delivery: I am committed to meeting project milestones and delivering the final product within the agreed-upon timeframe.

I would love to discuss your project further and explore how I can assist you in achieving your goals. Please feel free to reach out to me, and let's schedule a call at your convenience.

Looking forward to hearing from you!

Best regards`,

	"bubble-2": `Hi there,

I hope this message finds you well. I am an experienced Bubble.io developer with a strong background in web application development. I have a passion for creating scalable and intuitive solutions that meet my clients' unique needs.

Past Projects:

https://alexcattoni.com

https://willericksson.com

✨✨✨✨✨✨✨ What I offer:

Proficiency in Bubble.io development, allowing me to swiftly transform your ideas into functional applications.

Strong problem-solving skills to address complex requirements and deliver innovative solutions.

Attention to detail and a focus on providing an exceptional user experience.

Timely delivery, ensuring that your project stays on track and meets deadlines.

Commitment to open communication and collaboration throughout the development process.

I would love to learn more about your project and discuss how I can contribute to its success. Feel free to connect with me to schedule a call or further discuss your requirements. You can find more information about my skills and experience on my Upwork profile: [Your Upwork Profile URL]

Looking forward to hearing from you!

Best regards`
}
