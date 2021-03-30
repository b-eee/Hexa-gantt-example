import { Utils } from "./utils";
import moment from "moment";
import { val } from "@uirouter/angularjs";

class DataService {
	constructor($http, $q, $state, toaster, $window, $rootScope, $timeout){
		this.$http = $http;
		this.$q = $q;
		this.$state = $state
		this.toaster = toaster;
		this.$window = $window
		this.$rootScope = $rootScope
		this.$timeout = $timeout;
		this.userId = "";
		this.username = "";
		this.ganttShowDays = 3
		this.userID = this.getUserID();
		this.items = [];
		this.data = [];
		this.tasks = [];
		this.clients = [];
		this.menus = [];
		this.mainMenus = [];
		this.optionMenus = [];
		this.fields = [];
		this.fieldIDs = [];
		this.menufieldIDs = [];
		this.options = [];
		this.cantMoveToRows = [];
		this.projectSelected = this.getProjectSelected();
		this.fieldOptionPairing;
		this.updateTaskRowAPIcounter = 0;
		this.originalTaskMovedID;
		this.idsAlreadyMoved = [];
		this.apiInProgress = false;
		this.backupData = [];
		this.currentSavedPoint = 0
		this.allowResizing = false;
		this.dataHasBeenChanged = false;
		this.newRowItem;
		this.saveLimit = 2;
		this.taskAreMovable = true;
		this.countDownSeconds = 6;
		this.countingDown = false;
        this.filteringNum = null;
        this.filteringSmoke = null;
		this.rowColors = {
			dark: '#d6d6d6',
			light: '#ffffff'
		}
		this.taskColors = {
			fixed: '#fc0303', //RED
			normal: '#0086d3',  //BLUE
			moving: '#36941f',  //GREEN
			dragging: '#b37100' //ORANGE
		}
		this.statusColors =  [
			{
				name: '仮予約',
				hex: '#00b4d8'
			},
			{
				name: '本予約',
				hex: '#0077b6'
			}
		]
		this.colors =  [
			{
				name: '',
				hex: ''
			},
			{
				name: 'イエロー',
				hex: '#ffbe0b'
			},
			{
				name: 'オレンジ',
				hex: '#fb5607'
			},
			{
				name: 'ピンク',
				hex: '#ff006e'
			},
			{
				name: 'パープル',
				hex: '#8338ec'
			},
			{
				name: 'ブルー',
				hex: '#3a86ff'
			},
		]
		this.SendEmailToShopActionId = "d96c04cb-2607-4db0-92dc-18dc0370e34c"
		this.SendEmailToConsumerActionId = "86dacd27-8681-4c82-b3bd-d52564a41371"
	}

	//[[[ LOADERS ]]]
	makeFields() {
		let fields = this.fields;
		//MAKES ARRAY OF FIELD IDS
		for (var key in fields){
			if(fields.hasOwnProperty(key)){
				this.fieldIDs.push(fields[key].field_id)
			}
		}
		//MAKES ARRAY OF OPTIONS
		for( var i = 0; i<this.fieldIDs.length; i++){
			let id = this.fieldIDs[i];
			if(fields[id].options != undefined){
				let optionObj = {
					name: fields[id].display_id,
					options: fields[id].options,
				}
				this.options.push(optionObj)
			}
		}
		//SORT OPTIONS
		for ( var i = 0; i<this.options.length; i++) {
			this.options[i].options.sort((a, b) => a.sort_id - b.sort_id)
		}
	}

	establishInitialConnection() {
		console.log('Establishing Initial Connection..')
		const payload =  {
			"channel": `worklifecare_channel_${this.projectSelected}`,
			"message": 'ESTABLISH_SEE_CONNECTION',
			"event": "message"
		}
		this.$http.post("/event/publish", payload)
	}

	async load() {
		this.clearEverything()
		this.establishInitialConnection()
		let self = this;
		return this.$q(async (resolve, reject) => {
		let data;
		let payload;

		self.apiInProgress = true;
		//GET USER INFO
		data = await this.$http.get("/api/userinfo").catch(e =>{
			reject(e);
		});
		this.userId = data.data.u_id
		this.username = data.data.username
		//GET FIELDS FOR PROPOSITION. THIS IS NEEDED FOR O_ID WHEN UPDATING ETC
		data = await this.$http.get("/api/applications/" + this.projectSelected +"/datastores/ROOM/fields").catch(e =>{
			reject(e);
		});
		this.fields = data.data.fields;
		this.setFieldIDs(data);
		this.makeFields();
		//Range the date for search condition.
        let target = new Date();;
        target.setHours(0,0,0,0)
        let from = Utils.oneDayBefore(target);
        let to = Utils.targetDateNoon(target, this.ganttShowDays)
		//Get PROPOSITION data
		let linkPayload = Utils.generateItemsPayload('PROPOSITION', from, to);
		data = await this.$http.post("/api/applications/" + this.projectSelected +"/datastores/PROPOSITION/items/search",linkPayload).catch(e =>{
			reject(e);
		});
		//PROPOSITION's array
		this.items = data.data.items;
		console.log("PROPOSITION", this.items);

		//Get CLIENT data
		payload = Utils.generatePayload('CLIENT', null);
		data = await this.$http.post("/api/applications/" + this.projectSelected +"/datastores/CLIENT/items/search", payload).catch(e =>{
			reject(e);
		});
		//CLIENT's array
		this.clients = data.data.items;
		console.log("CLIENT", this.clients);
		//Get time scale
		if (this.clients.length > 0) {
			this.$rootScope.$broadcast('timeScale', this.clients[0].time);
		}
		
		//Get ROOM data
		payload = Utils.generatePayload('ROOM', "SORT_ORDER");		
		data = await this.$http.post("/api/applications/" + this.projectSelected +"/datastores/ROOM/items/search",payload).catch(e =>{
			reject(e);
		});
		//ROOM's array
		this.tasks = data.data.items;
		console.log("ROOM", this.tasks);

		//Get MENU data
		payload = Utils.generatePayload('MENU', "SORT_ORDER");		
		data = await this.$http.post("/api/applications/" + this.projectSelected +"/datastores/MENU/items/search",payload).catch(e =>{
			reject(e);
		});
		//MENU's array
		this.menus = data.data.items;
		console.log("MENU", this.menus);
		this.classifyMenu()
		self.apiInProgress = false;

		this.makeDataPromise()
		this.updateRowFilter()
		this.sse = new EventSource(`${SSE_EVENT_HOST}/sse?channel=worklifecare_channel_${this.projectSelected}`); ///SUBSCRIBE?CHANNEL=TEST_12345

		this.sse.onmessage = function(event) {
			let data = JSON.parse(event.data)

			if(data.message === 'ESTABLISH_SEE_CONNECTION' || self.userID === data.message) {
				let consoleLogMsg = (self.userID === data.message) ? 'I sent the message' : 'Establishing initial SSE connection'
				console.log('NO ACTION SSE RECEIEVED OF TYPE:  ', consoleLogMsg)
			} else {
				console.log('Someone else made a change, getitng new data and wiaitng')
				self.$rootScope.$broadcast('closeNewItem')
				self.$rootScope.$broadcast('closeTaskInfo')

				self.startCountDown()
			}
		}
			resolve();
		});
	}

	async loadItems(from, to) {
		this.sendMessage()
		let self = this
		return this.$q(async (resolve, reject) => {
			self.apiInProgress = true;
			let linkPayload = Utils.generateItemsPayload('PROPOSITION', from, to);
			let data = await self.$http.post("/api/applications/" + self.projectSelected +"/datastores/PROPOSITION/items/search",linkPayload).catch(e =>{
				reject(e);
			});
			self.apiInProgress = false;

			self.items = data.data.items; //PROPOSITION's array
			console.log("PROPOSITION", self.items);
			// Update task list for each data.
			for(var i = 0; i<self.data.length; i++){
				self.data[i].tasks = self.matchLinks(self.data[i].id)
			}
			self.addSavePoint()
			resolve();
		});
	}

	classifyMenu() {
		if (this.menus == undefined) { return }
		this.mainMenus.length = 0
		this.optionMenus.length = 0
		this.mainMenus.unshift({menuName: "手動入力"})
		this.optionMenus.unshift({menuName: "手動入力"})
		for(var i = 0; i<this.menus.length; i++){
			if (this.menus[i].duration && this.menus[i].price) {
				this.menus[i].menuName = this.menus[i].menuName + " " + this.menus[i].duration + " " + this.menus[i].price
			} else if (this.menus[i].duration) {
				this.menus[i].menuName = this.menus[i].menuName + " " + this.menus[i].duration
			}else if (this.menus[i].price) {
				this.menus[i].menuName = this.menus[i].menuName + " " + this.menus[i].price
			}
			if (this.menus[i].option == "メインメニュー") {
				this.mainMenus.push(this.menus[i])
			} else if (this.menus[i].option == "オプションメニュー") {
				this.optionMenus.push(this.menus[i])
			}
		}
	}
	
	makeDataPromise() {
		if (this.tasks == undefined) { return }
		for(var i = 0; i<this.tasks.length; i++){
			this.data.push({
				id: this.tasks[i].i_id,
				name: this.tasks[i].name + " " + this.tasks[i].number + " " + this.tasks[i].smoking,
				data: this.tasks[i],
				tasks: this.matchLinks(this.tasks[i].i_id)
			})
		}
		this.addSavePoint()
	}

	matchLinks(currentTaskID) {
		let row_id = currentTaskID;
		let rowTasks = [];
		for(var i = 0; i<this.items.length;i++){
			if(this.items[i].item_links.links != null){
				for(var j = 0; j< this.items[i].item_links.links.length; j++){
					// if(this.items[i].item_links.links[j].d_id != "ROOM"){
					// 	continue
					// }
					for(var k = 0; k < this.items[i].item_links.links[j].items.length; k++){
						let linked_id = this.items[i].item_links.links[j].items[k].i_id
						if(row_id == linked_id){
							let movableType  = true
							let fromTime = this.generateDateTime(this.items[i].reservationStartDate, this.items[i].reservationStartTime)
							let endTime = this.generateDateTime(this.items[i].reservationEndDate, this.items[i].reservationEndTime)
							let convertedData = {
								movable: movableType,
								name: this.getBarTitle(this.items[i].person, this.items[i].reservation_01),
								from: fromTime,
								to: endTime,
								color: this.getTaskColor(this.items[i].COLOR, this.items[i].reservationStatus),
								data: this.items[i]
							}
							rowTasks.push(convertedData)
							break;
						}
					}
				}
			}
		}
		return rowTasks
	}

	//[[[ VISUAL UPDATES ]]]
	editTaskVisually(task) {
		let findTarget = false;
		let shoudUpdatePosition = false;
		let oldTasker = null;
		for(let row of this.data){
			for(let tasker of row.tasks){
				if(tasker.data.i_id === task.i_id){
					tasker.data = task
					tasker.name = this.getBarTitle(task.person, task.reservation_01)
					tasker.color = this.getTaskColor(task.COLOR, task.reservationStatus)
					let from = this.generateDateTime(task.reservationStartDate, task.reservationStartTime)
					let to = this.generateDateTime(task.reservationEndDate, task.reservationEndTime)
					tasker.from = moment(from)
					tasker.to = moment(to)
					findTarget = true
					//Should update task position if room id is not match.
					if (task.roomId != row.data.i_id) {
						shoudUpdatePosition = true;
						oldTasker = tasker;
					}
					break
				}
			}
			if(findTarget){
				break
			}
		}
		if (shoudUpdatePosition && oldTasker != null) {
			for(let row of this.data){
				if (row.data.i_id === oldTasker.roomId) {
					row.tasks.push(oldTasker);
					break;
				}
			}
		}
		this.addSavePoint();
	}

	updateTaskVisually(uTask) {
		this.data.forEach((row) => {
			if(row.id == uTask.row.model.id) {
				row.tasks.forEach(task => {
					if(task.id == uTask.model.id){
						task.data.roomName = uTask.row.model.data.name
						task.data.reservationStartDate = uTask.model.from.toDate()
						task.data.reservationEndDate = uTask.model.to.toDate()
						task.data.reservationStartTime = uTask.model.from.format("HH:mm")
						task.data.reservationEndTime = uTask.model.to.format("HH:mm")
						return
					}
				});
			}
		});
	}

	addTaskVisually(task, i_id, newItem) {
		let row;
		if(task.roomName){row = this.data.find(room => room.data.name === task.roomName);}
		if(!row) { return; }
		task["i_id"] = i_id;

		let movableType  = true
		row.tasks.push({
			color: this.getTaskColor(task.COLOR, task.reservationStatus),
			data: task,
			to: task.TO,
			name: this.getBarTitle(task.person, task.reservation_01),
			movable: movableType,
			from: task.FROM
		});
	}

	//[[[ API ]]]

	savePointReAddTask(task) {
		this.sendMessage()
		let self = this;
		return this.$q(function(resolve, reject) {

			let optArr = [];
			let catArr = [];
			catArr.push(task.data ? task.data.category : task.category) ;
			let fixedArr = [];
			fixedArr.push(task.data ? task.data.fixed : task.fixed);

			let newItem = {
				"CAR_NAME": task.data ? task.data.car_name : task.car_name,
				"CAR_TYPE": task.data ? task.data.car_type : task.car_type,
				"CUSTOMER_NAME": task.data ? task.data.customer_name : task.customer_name,
				"FROM_DATE": task.from,
				"TO_DATE": task.to,
				"CATEGORY": self.getOptionID('CATEGORY', catArr ),
				"OPTION": self.getOptionID('OPTION', task.data ? task.data.option : task.option),
				"FIXED": self.getOptionID('FIXED', fixedArr)
			}

			let payload = {
				"item":  newItem,
				"use_display_id": true
			}

			return self.$http.post("api/applications/" + self.projectSelected + "/datastores/PROPOSITION/items/new", payload).then((response)=>{

				let ID = response.data.item_id
				payload = {
					'link_datastore_id': "CARS",
					'link_item_id': self.getRowIDfromTaskID(task.data.i_id)
				}
				return self.$http.post(`api/applications/${self.projectSelected}/datastores/PROPOSITION/items/addlink/${ID}`, payload)
			}).then(()=>{
				resolve()
			})
		})
	}

	getAllcurrentAPIdata() {
		let linkPayload = {
			"datastore_id": "PROPOSITION", 
			"per_page": 1000,
			"page": 1,
			"use_field_id": true,
			"include_links": true
		};
		return this.$http.post("/api/applications/" + this.projectSelected +"/datastores/PROPOSITION/items/search",linkPayload).catch(e =>{
			reject(e); 
		});
	}

	createNewItem(task) {
		let self = this;
		this.sendMessage()
		return this.$q(async (resolve, reject) => {
			let now = new Date();
			task["insertDate"] = now;
			let newItem = {
				personInCharge: task.personInCharge,
				shopEmailAddress: task.shopEmailAddress,
				person: task.person,
				endTell: task.endTell,
				email: task.email,
				mainMenu: task.mainMenu,
				optionMenu: task.optionMenu,
				notes: task.notes,
				roomId: task.roomId,
				roomName: task.roomName,
				reservationStartDate: Utils.startingDate(task.reservationStartDate),
				reservationEndDate: Utils.startingDate(task.reservationEndDate),
				reservationStartTime: Utils.generateRequestTimeString(task.reservationStartTime),
				reservationEndTime: Utils.generateRequestTimeString(task.reservationEndTime),
				reservationStatus: task.reservationStatus,
				insertDate: task.insertDate,
				insertTime: Utils.generateRequestTimeString(moment(now).format("HH:mm")),
				COLOR: task.COLOR,
				lastUpdateUser: [self.userId]
			};
			task["lastUpdateUser"] = self.username;

			self.apiInProgress = true;
			// Get reservation_01 by GetAutoNum API
			let res = await self.$http.get(`api/applications/${self.projectSelected}/datastores/PROPOSITION/fields/reservation_01/autonum?branch_key=no`).catch(e =>{
				reject("通信エラーが発生しました");
			});
			if (res.status != 200 || !res.data.result) {
				reject("エラーが発生しました");
			} else {
				// Save new item into DB
				let number = res.data.result.number;
				task["reservationNo"] = Utils.UpperHex(number, 6);
				newItem["reservationNo"] = task["reservationNo"];
				newItem["reservationNumber"] = number;
	
				let payload = {
					"item":  newItem,
					"use_display_id": true
				}
				res = await self.$http.post("api/applications/" + self.projectSelected + "/datastores/PROPOSITION/items/new", payload).catch(e =>{
					reject("通信エラーが発生しました");
				});
				if (res.status != 200 || !res.data.item_id) {
					reject("保存に失敗しました");
				} else {
					// Associate the item with the relevant room record.
					self.addTaskVisually(task, res.data.item_id, newItem);
					self.addSavePoint();
					task.i_id = res.data.item_id
					let ID = res.data.item_id;
					task.linked_row = self.getRowIDfromTaskID(ID)
					payload = {
						'link_datastore_id': "ROOM",
						'link_item_id': self.getRowIDfromTaskID(ID)
					}
					res = await self.$http.post(`api/applications/${self.projectSelected}/datastores/PROPOSITION/items/addlink/${ID}`, payload).then(()=>{
						self.SendMailToShopAndConsumer(task)
						resolve()
					})
				}
			}
			self.apiInProgress = false;
		})
	}
	
	sendMessage() {
		let dPayload =  {
			"channel": `worklifecare_channel_${this.projectSelected}`,
			"message": this.userID,
			"event": "message"
		}
		this.$http.post("/event/publish", dPayload)
	}

	saveEverythingAPI(task, apiTasks) {
		this.sendMessage()
		let self = this
		return this.$q(function(resolve, reject) {
			if(!task) { reject; }
			let catArr = []
			catArr.push(task.data.category)
			let fixedArr = [];
			fixedArr.push(task.data.fixed)
			self.apiInProgress = true;
			self.disableAllRowAfterMoving()
			let ID = task.data.i_id
			let originalLinkedRow = self.getLinkedItemIDbeforeSave(ID, apiTasks)

			let payload = {
				"history": {
					"comment": "Save point selected"
				},
				"changes": [
					{
						"id": "CAR_TYPE",
						"value": task.data.car_type
					},
					{
						"id": "CAR_NAME",   //careful here task.model.data.___ not being updated currently
						"value": task.data.car_name
					},
					{
						"id": "CATEGORY",
						"value": self.getOptionID('CATEGORY', catArr)
					},
					{
						"id": "OPTION",
						"value": self.getOptionID('OPTION', task.data.option)
					},
					{
						"id": "FIXED",
						"value": self.getOptionID('FIXED', fixedArr)
					},
					{
						"id": "CUSTOMER_NAME",
						"value": task.data.customer_name
					},
					{
						"id": "FROM_DATE",
						"value": task.from
					},
					{
						"id": "TO_DATE",
						"value": task.to
					},
					{
						"id": "title",
						"value": task.data.title
					},
				],
				"use_display_id": true,
				"is_force_update": true,
			}

			if(originalLinkedRow != undefined){
				self.$http.post(`api/applications/${self.projectSelected}/datastores/PROPOSITION/items/edit/${ID}`, payload)
				.then((res)=>{
					let newRowID = self.getRowIDfromTaskID(ID);
					let addPayload = {
						"old_link_datastore_id": "CARS",
						"old_link_item_id": originalLinkedRow,
						"new_link_datastore_id": "CARS",
						"new_link_item_id": newRowID
					};
					return self.$http.post(`api/applications/${self.projectSelected}/datastores/PROPOSITION/items/updatelink/${ID}`, addPayload)
				})
				.then(()=>{
					self.apiInProgress = false;
					self.updateRowFilter()
					resolve()
				})
			} else {
				self.savePointReAddTask(task)
				resolve()
			}
		})
	}

	//this is for model (gtask)
	updateTask(task, originalRowID) {
		this.sendMessage()
		let self = this
		return this.$q(function(resolve, reject) {

			if(!task || !task.model || !task.model.data) { reject; }

			self.apiInProgress = true;
			self.disableAllRowAfterMoving()
			let ID = task.model.data.i_id
			let newRowID = task.row.model.data.i_id;
			let newRowIDComm = self.getRowNameFromID(newRowID)
			let oldRowNameComm = self.getRowNameFromID(originalRowID)
			let comment = `${task.model.name}
				Moved from ${oldRowNameComm} to ${newRowIDComm}.
				from: ${task.model.from.toString()}
				to: ${task.model.to.toString()}`

			let payload = {
				"history": {
					"comment": comment
				},
				"changes": [
					{
						"id": "reservationStartDate",
						"value": Utils.startingDate(task.model.from)
					},
					{
						"id": "reservationEndDate",
						"value": Utils.startingDate(task.model.to)
					},
					{
						"id": "reservationStartTime",
						"value": Utils.generateRequestTimeString(task.model.from.format("HH:mm"))
					},
					{
						"id": "reservationEndTime",
						"value": Utils.generateRequestTimeString(task.model.to.format("HH:mm"))
					},
					{
						"id": "roomId",
						"value": task.row.model.data.i_id
					},
					{
						"id": "roomName",
						"value": task.row.model.data.name
					},
					{
						"id": "lastUpdateUser",
						"value": [self.userId]
					}
				],
				"use_display_id": true,
				"is_force_update": true,
			}
			task["lastUpdateUser"] = self.username;
			self.$http.post(`api/applications/${self.projectSelected}/datastores/PROPOSITION/items/edit/${ID}`, payload)
			.then((res)=>{
				if (res.status === 200) {
					task.model.data.rev_no = +task.model.data.rev_no + 1
					if (newRowID != originalRowID) {
						let addPayload = {
							"old_link_datastore_id": "ROOM",
							"old_link_item_id": originalRowID,
							"new_link_datastore_id": "ROOM",
							"new_link_item_id": newRowID
						};
						self.$http.post(`api/applications/${self.projectSelected}/datastores/PROPOSITION/items/updatelink/${ID}`, addPayload)
					}
					self.updateTaskVisually(task)
					self.updateRowFilter()
					self.SendMailToShopAndConsumer(task.model.data)
				}else {
					self.showToaster('error', "エラー" , "保存に失敗しました")
				}
				self.apiInProgress = false;
				resolve()
			})
		})
	}

	updateTaskRowAPI(itemID, newRowName, recusDataArr) {
		this.sendMessage()
		this.updateTaskRowAPIcounter++
		if(itemID === this.originalTaskMovedID){return}
		let ID = itemID
		let oldRowName = this.getRowNameFromRecursDataArr(recusDataArr, itemID)
		let oldRowID = this.getRowItemIDfromRowName(oldRowName)
		this.apiInProgress = true;

		let payload = {
			"history": {
				"comment": "test comment"
			},
			"changes": [
				{
					"id": "CAR_NAME",   //careful here task.model.data.___ not being updated currently
					"value": newRowName
				}
			],
			"use_display_id": true,
			"is_force_update": true
		}
		// console.log('updateTaskRowAPI', payload)

		this.disableAllRowAfterMoving()
		this.$http.post(`api/applications/${this.projectSelected}/datastores/PROPOSITION/items/edit/${ID}`, payload)
		.then((res)=>{
			let newRowID = this.getRowItemIDfromRowName(newRowName);
			let addPayload = {
				"old_link_datastore_id": "CARS",
				"old_link_item_id": oldRowID,
				"new_link_datastore_id": "CARS",
				"new_link_item_id": newRowID
			};
			return this.$http.post(`api/applications/${this.projectSelected}/datastores/PROPOSITION/items/updatelink/${ID}`, addPayload)
		})
		.then(()=>{
			this.apiInProgress = false;
			this.updateRowFilter()
		})
	}

	updateOriginalTask(task, delRowID) {
		if(!task.data) { return; }
		this.sendMessage()
		let ID = task.data.i_id

		let catArr = []
		catArr.push(task.data.category)

		let payload = {
			"history": {
				"comment": "test comment"
			},
			"changes": [
				{
				"id": "CAR_TYPE",
				"value": task.data.car_type
				},
				{
				"id": "CAR_NAME",   //careful here task.model.data.___ not being updated currently
				"value": task.data.car_name
				},
				{
				"id": "CATEGORY",
				"value": this.getOptionID('CATEGORY', catArr)
				},
				{
				"id": "CUSTOMER_NAME",
				"value": task.data.customer_name
				},
				{
				"id": "FROM_DATE",
				"value": task.from
				},
				{
				"id": "TO_DATE",
				"value": task.to
				},
				{
				"id": "title",
				"value": task.data.title
				}
			],
			"use_display_id": true,
			"is_force_update": true
		}
		this.$http.post(`api/applications/${this.projectSelected}/datastores/PROPOSITION/items/edit/${ID}`, payload)
		.then((res)=>{
			let newRowID = this.getRowItemIDfromRowName(task.data.car_name);
			let addPayload = {
				"old_link_datastore_id": "CARS",
				"old_link_item_id": delRowID,
				"new_link_datastore_id": "CARS",
				"new_link_item_id": newRowID
			};
			return this.$http.post(`api/applications/${this.projectSelected}/datastores/PROPOSITION/items/updatelink/${ID}`, addPayload)
		})
		.then(()=>{
			this.updateRowFilter()
		})
	}

	editTask(task, originalRowId) {
		this.sendMessage()
		let self = this
		return this.$q(async (resolve, reject) => {
			if(!task) { reject; }
			self.apiInProgress = true;
			self.disableAllRowAfterMoving()
			let ID = task.i_id
			let payload = {
				"history": {
					"comment": "Edit task."
				},
				"changes": [
					{
						"id": "personInCharge",
						"value": task.personInCharge
					},
					{
						"id": "shopEmailAddress",
						"value": task.shopEmailAddress
					},
					{
						"id": "person",
						"value": task.person
					},
					{
						"id": "endTell",
						"value": task.endTell
					},
					{
						"id": "email",
						"value": task.email
					},
					{
						"id": "mainMenu",
						"value": task.mainMenu
					},
					{
						"id": "optionMenu",
						"value": task.optionMenu
					},
					{
						"id": "notes",
						"value": task.notes
					},
					{
						"id": "roomId",
						"value": task.roomId
					},
					{
						"id": "roomName",
						"value": task.roomName
					},
					{
						"id": "reservationStartDate",
						"value": Utils.startingDate(task.reservationStartDate)
					},
					{
						"id": "reservationEndDate",
						"value": Utils.startingDate(task.reservationEndDate)
					},
					{
						"id": "reservationStartTime",
						"value": Utils.generateRequestTimeString(task.reservationStartTime)
					},
					{
						"id": "reservationEndTime",
						"value": Utils.generateRequestTimeString(task.reservationEndTime)
					},
					{
						"id": "reservationStatus",
						"value": task.reservationStatus
					},
					{
						"id": "COLOR",
						"value": task.COLOR
					},
					{
						"id": "lastUpdateUser",
						"value": [self.userId]
					}
				],
				"use_display_id": true,
				"is_force_update": true,
			}
			task["lastUpdateUser"] = self.username;
			self.$http.post(`api/applications/${self.projectSelected}/datastores/PROPOSITION/items/edit/${ID}`, payload)
			.then((res)=>{
				if (res.status === 200) {
					task.rev_no = +task.rev_no + 1
					if (task.roomId != originalRowId) {
						let addPayload = {
							"old_link_datastore_id": "ROOM",
							"old_link_item_id": originalRowId,
							"new_link_datastore_id": "ROOM",
							"new_link_item_id": task.roomId
						};
						self.$http.post(`api/applications/${self.projectSelected}/datastores/PROPOSITION/items/updatelink/${ID}`, addPayload)
					}
					self.editTaskVisually(task);
					self.updateRowFilter()
					self.SendMailToShopAndConsumer(task)
				}else {
					self.showToaster('error', "エラー" , "保存に失敗しました")
				}
				self.apiInProgress = false;
				resolve()
			})
		})
	}

	async executeAction(itemId, actionId, payload) {
		let self = this;
		return this.$q(function(resolve, reject) {
			self.apiInProgress = true;
			self.$http.post(`api/applications/${self.projectSelected}/datastores/PROPOSITION/items/action/${itemId}/${actionId}`, payload)
			.then((res)=>{
				self.apiInProgress = false;
				if (res.status == 200) {
					self.showToaster('info', "注意!" , "メールを送信しました")
				}else {
					self.showToaster('error', "エラー" , "メール送信に失敗しました")
				}
				resolve()
			})
		})
	}

	async SendMailToShopAndConsumer(task) {
		if(!task) { return; }
		let itemId = task.i_id
		// Send mail to Shop.
		if (task.shopEmailAddress != "") {
			let revNo = task.rev_no ? +task.rev_no : 1
			await this.executeAction(itemId, this.SendEmailToShopActionId, {
				"comment": `Excute action by actionId = ${this.SendEmailToShopActionId}.`,
				"item": {},
				"rev_no": +revNo
			}).then(() => {
				task.rev_no = revNo + 1
			})
		}
		// Send mail to Consumer.
		if (task.email != "") {
			let revNo = task.rev_no ? +task.rev_no : 1
			task.rev_no = revNo
			await this.executeAction(itemId, this.SendEmailToConsumerActionId, {
				"comment": `Excute action by actionId = ${this.SendEmailToConsumerActionId}.`,
				"item": {},
				"rev_no": +revNo
			}).then(() => {
				task.rev_no = revNo + 1
			})
		}
	}

	updateTaskRowAPIQ(itemID, newRowName, recusDataArr) {
		this.sendMessage()
		let self = this
		return this.$q(function(resolve, reject) {
			self.updateTaskRowAPIcounter++

			if(itemID === self.originalTaskMovedID){return}
			let ID = itemID
			let oldRowName = self.getRowNameFromRecursDataArr(recusDataArr, itemID)
			let oldRowID = self.getRowItemIDfromRowName(oldRowName)
			self.apiInProgress = true;

			let payload = {
				"history": {
					"comment": "test comment"
				},
				"changes": [
					{
					"id": "CAR_NAME",   //careful here task.model.data.___ not being updated currently
					"value": newRowName
					}
				],
				"use_display_id": true,
				"is_force_update": true
			}
			self.disableAllRowAfterMoving()
			self.$http.post(`api/applications/${self.projectSelected}/datastores/PROPOSITION/items/edit/${ID}`, payload)
			.then((res)=>{
				let newRowID = self.getRowItemIDfromRowName(newRowName);
				let addPayload = {
					"old_link_datastore_id": "CARS",
					"old_link_item_id": oldRowID,
					"new_link_datastore_id": "CARS",
					"new_link_item_id": newRowID
				};
				return self.$http.post(`api/applications/${self.projectSelected}/datastores/PROPOSITION/items/updatelink/${ID}`, addPayload)
			})
			.then(()=>{
				self.apiInProgress = false;
				self.updateRowFilter()
				resolve()
			})
		})
	}

	updateCarRowAPI(rowName, color, plate, insurance) {
		this.sendMessage()
		let ID = this.getRowItemIDfromRowName(rowName);
		let payload = {
			"history": {
				"comment": "test comment"
			},
			"changes": [
				{
				"id": "COLOR",
				"value": color ? color: ''
				},
				{
				"id": "PLATE",
				"value": plate ? plate : null
				},
				{
				"id": "INSURANCE",
				"value": insurance ? insurance : undefined
				}
			],
			"use_display_id": true,
			"is_force_update": true
		}
		return this.$http.post(`api/applications/${this.projectSelected}/datastores/CARS/items/edit/${ID}`, payload)
	}

	deleteTask(id) {
		this.sendMessage()
		this.deleteTaskVisually(id);
		return this.$http.delete(`api/applications/${this.projectSelected}/datastores/PROPOSITION/items/delete/${id}`, {data:{}})
	}
	
	deleteTaskRevert(id) {
		let self = this;
		return this.$q(function(resolve, reject) {
			self.sendMessage()
			self.deleteTaskVisually(id);
			return self.$http.delete(`api/applications/${self.projectSelected}/datastores/PROPOSITION/items/delete/${id}`, {data:{}}).then(()=>{
			resolve()
			})


		})
	}

	deleteTaskVisually(id) {
		if(this.currentSavedPoint+1 === this.backupData.length){
			for(let i=0; i < this.data.length; i ++){
				for(let k = 0; k < this.data[i].tasks.length; k++){
					if(id === this.data[i].tasks[k].data.i_id){
						this.data[i].tasks.splice(k,1)
					}
				}
			}
		}
	}

	deleteTaskFromDatabase(id) {
		this.sendMessage()
		return this.$http.delete(`api/applications/${this.projectSelected}/datastores/PROPOSITION/items/delete/${id}`, {data:{}});
	}


	//[[[ UTILITIES ]]]

	async updateAllTasksAPI(reservations) {
		for(let row of this.data){
			for(let task of row.tasks){
				if(task.data.i_id === 123456789){
					continue
				}
				let taskIsUnaltered = this.isSavedTaskExactlyTheSame(task, reservations)
				//NEEED CHECK HERE TO SKIP IF SAME?
				if(!taskIsUnaltered){
					await this.saveEverythingAPI(task, reservations)
				}
			}
		}
	}

	newDataObj(data) {
		this.data = data
	}

	disableAllRowAfterMoving() {
		this.data.forEach(data => {
			this.setRowUnmovable(data)
		})
	}

	optionStrToArray(optionsStr) {
		if(optionsStr != undefined){
			let optionArr = optionsStr.split(',')
			return optionArr
		}else{
			return ''
		}
	}

	checkIfCanMoveTo(task, targetRow) {
		if(this.taskAreMovable === false){
			return false;
		}
		if(this.cantMoveToRows.includes(targetRow.model.id)){
			return false;
		}else{
			return true;
		}
	}

	isMovable(taskFIXED) {
		if(taskFIXED == '限定あり'){
			console.log('MOVABLE RETURNING FALSE')
			return false;
		}else if (taskFIXED == '限定なし'){
			return true
		}
	}

	showToaster(type, title, message) {
		this.toaster.pop(type, title, message)
		if(this.$window.screen.width < 1000){
			let x = (this.$window.screen.width / 2);
			let y = (this.$window.screen.height);//window.screen.height
			let toastEle = document.getElementById('toast-container')
			toastEle.style.left = x
			toastEle.style.top = 0
		}
	}

	clearEverything() {
		this.items = [];
		this.data = [];
		this.tasks = [];
		this.fields = [];
		this.fieldIDs = [];
		this.menufieldIDs = [];
		this.options = [];
		this.cantMoveToRows = [];
	}

	isSavedTaskExactlyTheSame(task, reservations) {
		for(let i = 0; i < reservations.length; i++){
			if(task.data.i_id === reservations[i].i_id){
				let res = reservations[i]
				return(
					res.CAR_NAME === task.data.car_name
					&&
					res.CAR_TYPE === task.data.car_type
					&&
					res.CATEGORY === task.data.category
					&&
					res.CUSTOMER_NAME === task.data.customer_name
					&&
					res.OPTION === task.data.option.join()
					&&
					res.COLOR === task.data.color
					&&
					moment(res.FROM_DATE).format('YYYY/MM/DD') === moment(task.from).format('YYYY/MM/DD')
					&&
					moment(res.TO_DATE).format('YYYY/MM/DD') === moment(task.to).format('YYYY/MM/DD')
					&&
					res.FIXED === task.data.fixed
				)
			}
		}
	}

	startCountDown() {
		if(this.countingDown){return}
		this.countingDown = true;
		this.countDownSeconds = 6;
		this.countDown()
	}

	countDown() {
		this.$timeout(()=>{
			if(this.countDownSeconds <= 0){
				this.backupData = [];
				this.currentSavedPoint = 1;
				this.clearEverything()
				this.load()
				this.countDownSeconds = 6;
				this.countingDown = false;
				//need function for all this. PLUS: dragging, resizing, making, etc, disabled, EVERYTHING from the users
			} else {
				console.log('seconds recur: ', this.countDownSeconds)
				this.countDownSeconds--;
				this.countDown()
			}
		}, 1000)
	}

	filterSmoke(value) {
		this.filteringSmoke = value;
		const optionsSmoke = this.options.find(o => o.name === 'smoking');
		optionsSmoke.options.forEach((option) => {
			if(option.selected && option.value === value){
				option.selected = true
			}else if (!option.selected && option.value === value) {
				option.selected = false
				this.filteringSmoke = null;
			}else {
				option.selected = false
			}
		});
		this.updateRowFilter();
	}

	filterNumber(value) {
		this.filteringNum = value;
		const optionsSmoke = this.options.find(o => o.name === 'number');
		optionsSmoke.options.forEach((option) => {
			if(option.selected && option.value === value){
				option.selected = true
			}else if (!option.selected && option.value === value) {
				option.selected = false
				this.filteringNum = null;
			}else {
				option.selected = false
			}
		});
		this.updateRowFilter();
	}

	updateRowFilter() {
		this.setAllRowsMovable();
		let num = this.filteringNum
		let smoke = this.filteringSmoke
		if (num != null || smoke != null) {
			for(let row of this.data){
				var unseletedRow = false;
				if (num != null && row.data.number != num) {
					unseletedRow = true;
				}
				if (smoke != null && row.data.smoking != smoke) {
					unseletedRow = true;
				}
				if (unseletedRow) {
					this.setRowUnselected(row)
				}
			}
		}
	}

	toasterPop(type, title, message) {
		this.toaster.pop(type, title , message)
		if(this.$window.screen.width < 1000){
			let x = (this.$window.screen.width / 2);
			let y = (this.$window.screen.height);
			let toastEle = document.getElementById('toast-container')
			toastEle.style.left = x
			toastEle.style.top = 0
		}
	}

	addSavePoint() {
		let self = this;
		let newSavePoint = JSON.stringify(self.data)
		self.backupData.push(newSavePoint)
		self.currentSavedPoint = self.backupData.length-1;
		if(self.backupData.length > self.saveLimit){
			self.backupData.shift()
			self.currentSavedPoint = self.backupData.length-1;
		}
	}

	async revertBack() {
		if(this.currentSavedPoint == 0){
			this.toasterPop('warning', '', 'これ以上操作を遡れません')
			return
		}
		this.currentSavedPoint--;
		this.data = [];
		let savePointStr = this.getCurrentSavedPoint();
		let savePointObj = JSON.parse(savePointStr);
		this.data = savePointObj;
		this.deleteAllGreyTasks();
		let reservationData = await this.getAllcurrentAPIdata()
		let reservations = reservationData.data.items
		let resIDarr = this.getAllCurrentTaskIidArr()
		let i = this.backupData.length-1;
		while( i > this.currentSavedPoint ){
			let savedPoint = JSON.parse(this.backupData[i])
			for(let row of savedPoint){
				for(let task of row.tasks){
					if(!resIDarr.includes(task.data.i_id)){
					//delete this task
					await this.deleteTaskRevert(task.data.i_id)
					}
				}
			}
			i--
		}
		  //HERE I NEED TO DELETE ALL THE TASKS THAT WERE MADE IN THE FUTURE OR THEY WILL COME BACK
		  await this.updateAllTasksAPI(reservations)
		  this.$window.location.reload();
	}

	getCurrentSavedPoint() {
		for(let i = 0; i < this.backupData.length; i++){
			if(i === this.currentSavedPoint){
				return this.backupData[i]
			}
		}
	}

	deleteAllGreyTasks() {
		for(let i = 0; i < this.data.length; i++){
			for( let k = 0; k < this.data[i].tasks.length; k++){
				if(this.data[i].tasks[k].name === '新しい予約'){
					this.data[i].tasks.splice(k,1)
				}
			}
		}
	}

	async saveCurrentPoint(currentDatas) {
		let self = this;
		return this.$q(async function(resolve, reject) {
			let reservationData = await self.getAllcurrentAPIdata()
			let reservations = reservationData.data.items
			let resIDarr = self.getAllCurrentTaskIidArr()
			self.deleteTasksNotInSavePoint(resIDarr, currentDatas);
			//HERE I NEED TO DELETE ALL THE TASKS THAT WERE MADE IN THE FUTURE OR THEY WILL COME BACK
			await self.updateAllTasksAPI(reservations)
			self.resetBackupData()
			resolve()
		})
	}

	getAllCurrentTaskIidArr() {
		let arr = [];
		let str = this.backupData[this.currentSavedPoint]
		let currDataParsed = JSON.parse(str)
		for(let row of currDataParsed){
			for(let task of row.tasks){
				arr.push(task.data.i_id)
			}
		}
		return arr;
	}

	deleteTasksNotInSavePoint(resIDarr, currentDatas) {
		let i = this.backupData.length-1;
		while( i > this.currentSavedPoint ){
			let savedPoint = JSON.parse(this.backupData[i])
			for(let row of savedPoint){
				for(let task of row.tasks){
					if(!resIDarr.includes(task.data.i_id)){
						//delete this task
						this.deleteTask(task.data.i_id)
					}
				}
			}
			i--
		}

		// if it need to delete new task in current datas
		let oldItems = [];
		let newItems = [];
		angular.forEach(currentDatas, function(res) {
			angular.forEach(res.tasks, function(task) {
				newItems.push(task.data.i_id);
			})
		})
		angular.forEach(JSON.parse(this.backupData[this.backupData.length - 1]), function(res) {
			angular.forEach(res.tasks, function(task) {
				oldItems.push(task.data.i_id);
			})
		})

		for(let id of newItems){
			if(!oldItems.includes(id)) this.deleteTask(id);
		}
	}

	resetBackupData() {
		let length = this.backupData.length;
		if(length > 1){
			let mostRecent = this.backupData.slice(length-1, length)
			this.backupData = [];
			this.backupData.push(mostRecent)
		}
		this.currentSavedPoint = 0;
	}

	//[[[ SETTERS ]]]


	setCantMoveToRows(rowID) {
		if(!this.cantMoveToRows.includes(rowID)){
			this.cantMoveToRows.push(rowID)
		}
	}

	setRowMoveable(data) {
		let self = this;
		let canMove = {
			'enabled': this.taskAreMovable === true ? true : false,
			'allowRowSwitching': function(task, targetRow){
				return self.checkIfCanMoveTo(task, targetRow)
			}
		}
		for(let task of data.tasks){
			if(task.data.fixed == '限定あり'){
				task.movable = false;
			}else{
				task.movable = canMove;
			}
		}
	}

	setRowUnmovable(data) {
		for(let task of data.tasks){
			task.movable = false;
		}
	}

	setFieldIDs(data) {
		let fields = data.data.fields;
		let matchedFields = [];
		for (var key in fields) {
			if (fields.hasOwnProperty(key)) {
				let fieldOpts = [];
				if(fields[key].options != undefined){
					for(var opt in fields[key].options){
						if(fields[key].options.hasOwnProperty(opt)){
						fieldOpts.push({
							optName: fields[key].options[opt].value,
							optID: fields[key].options[opt].option_id
						});
						}
					}
				}
				let obj = {
					id: key,
					name: fields[key].display_id,
					options: fieldOpts
				};
				matchedFields.push(obj);
			}
		}
		this.fieldOptionPairing = matchedFields;
	}

	setRowUnselected(data) {
		this.setRowUnmovable(data)
		this.setCantMoveToRows(data.id)
		data.classes = 'column-header-unselected-font-color'
		data.color = this.rowColors.dark
	}

	setAllRowsMovable() {
		let self = this;
		this.cantMoveToRows = [];
		for(let data of this.data){
			data.color = this.rowColors.light //set all tasks to moveable (color)
			data.classes = 'column-header-selected-font-color'
			for(let task of data.tasks){
				if(task.data == undefined){continue}
				task.movable = {
					'enabled': this.taskAreMovable === true ? true : false,
					'allowRowSwitching': function(task, targetRow){
						return self.checkIfCanMoveTo(task, targetRow)
					}
				}
			}
		}
	}

	//[[[ GETTERS ]]]
	getLinkedItemIDbeforeSave(ID, apiTasks) {
		for(let task of apiTasks){
			if (ID === task.i_id){
				if(task.item_links.db_count != 0){
					return task.item_links.links[0].items[0].i_id
				}
			}
		}
	}

	getUserID() {
		let number = parseInt(Math.random()*1000000000, 10)
		return number
	}

	getLastOrderPoint() {
		let lastSavedPoint = 0;
		for(let bData of this.backupData){
			if(bData.order > lastSavedPoint){
				lastSavedPoint = bData.order
			}
		}
		return lastSavedPoint
	}

	getTaskColor(itemColor, status) {
		if(itemColor == null || itemColor == ""){
			// No color defined, show color by status.
			let statusColor = this.statusColors.find(color => color.name === status)
			return statusColor ? statusColor.hex : this.taskColors.normal
		} else {
			return itemColor
		}
	}

	getRowFromId(id){
		for(let i = 0; i < this.data.length; i++){
			if(this.data[i].id === id){
				return this.data[i]
			}
		}
	}

	getRowFromName(rowName){
		for(let i = 0; i < this.data.length; i++){
			if(this.data[i].name === rowName){
				return this.data[i]
			}
		}
	}

	getRowNameFromID(id) {
		for(let i = 0; i < this.data.length; i ++){
			if(this.data[i].id === id){
				return this.data[i].name
			}
		}
	}

	getRowIDfromTaskID(taskID) {
		for(let data of this.data){
			for(let task of data.tasks){
				if(task.data === undefined || task.data === null){continue}
				if(task.data.i_id === taskID){
					return data.data.i_id
				}
			}
		}
	}

	getItemLinkInfo(taskidid) {
		let id = taskidid;
		let linkData = {
			link_datastore_id: null,
			link_item_id: null,
			d_id: null,
			i_id : null
		}
		for(let item of this.items){
			if(item.i_id === id){
				linkData.link_datastore_id = item.item_links.links[0].d_id;
				linkData.link_item_id = item.item_links.links[0].items[0].i_id
				linkData.d_id = item.d_id,
				linkData.i_id = item.i_id
				return linkData;
			}
		}
	}

	getProjectSelected() {
		return localStorage.getItem('projectSelected')
	}

	getAPIinProgress() {
		return !this.apiInProgress;
	}

	getOptionID(fieldName, options) {
		let idArr = [];
		this.fieldOptionPairing.forEach(field => {
			if(field.name === fieldName){
				field.options.forEach(foption => {
					for(let opt of options){
						if(opt === foption.optName){
						idArr.push(foption.optID)
						}
					}
				});
			}
		});
		if(fieldName == 'OPTION'){
			return idArr;
		} else {
			return idArr.join();
		}
	}

	getStartTimeZoneOptionID(strTime) {
		let timeArr = strTime.split(":")
		if (timeArr.length == 2) {
			let hour = parseInt(timeArr[0])
			let minute = parseInt(timeArr[1])
			if (hour < 12) {
				return this.getOptionID('startTimezone', ["午前"])
			} else if (hour === 12 && minute === 0) {
				return this.getOptionID('startTimezone', ["午前"])
			}else {
				return this.getOptionID('startTimezone', ["午後"])
			}
		}
		return null
	}

	getEndTimeZoneOptionID(strTime) {
		let timeArr = strTime.split(":")
		if (timeArr.length == 2) {
			let hour = parseInt(timeArr[0])
			let minute = parseInt(timeArr[1])
			if (hour < 12) {
				return this.getOptionID('endTimezone', ["午前"])
			} else if (hour === 12 && minute === 0) {
				return this.getOptionID('endTimezone', ["午前"])
			}else {
				return this.getOptionID('endTimezone', ["午後"])
			}
		}
		return null
	}

	getOptions(fieldName) {
		let optionArr = [];
		this.fieldOptionPairing.forEach(field => {
			if(field.name === fieldName){
				field.options.forEach(foption => {
					optionArr.push(foption.optName)
				});
			}
		});
		return optionArr
	}

	getRowItemIDfromRowName(rowName) {
		for(let i = 0; i < this.data.length; i++){
			if ( this.data[i].name === rowName){
				return this.data[i].data.i_id
			}
		}
	}

	getRowNameFromRecursDataArr(recusDataArr, taskid) {
		for( let i = 0; i < recusDataArr.length; i ++){
			if ( recusDataArr[i].data.i_id === taskid){
				return recusDataArr[i].data.car_name
			}
		}
	}

	getBarTitle(text1, text2) {
		return text1
	}

	generateDateTime(strDate, strTime) {
		let target = new Date(strDate)
		if (strTime) {
			let timeArr = strTime.split(":")
			if (timeArr.length == 2) {
				target.setHours(timeArr[0])
				target.setMinutes(timeArr[1])
			}
		}
		return target
	}

}

export default DataService;