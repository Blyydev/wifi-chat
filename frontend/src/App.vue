<template>
	<header class="desktop">Welcome on the Wifi Chat, you're <strong>{{ pseudo}}</strong> !</header>
	<header class="mobile">Welcome <strong>{{ pseudo}}</strong></header>
	<div id="chat">
		<div id="messages">
			<div class="connexion" v-if="myIp != null">
				Connected on Wifi chat {{ myIp }}
			</div>
			<div v-for="entry in messages" class="item" :class="{mine : entry.isMine}">
				<div class="left">
					<time>{{ entry.timer }}</time>
					<strong>{{ entry.pseudo }}</strong>
				</div>
				<div class="content" v-html="messageChecker(entry.message)"></div>
			</div>
		</div>
		<div class="message_form">
			<form v-on:submit.prevent="sendMessage">
				<input type="text" v-model="tmpMessage" ref="messInput" placeholder="Taper votre message, puis [Entrée] pour l'envoyer">
			</form>
		</div>
	</div>
</template>

<script>
	import { io } from 'socket.io-client'
	import $ from "jquery"

	import popSound from './assets/pop.mp3'
	let notifSound = new Audio(popSound)
		notifSound.volume = 0.7;

	export default {
		data() {
			return {
				myIp:null,
				socket : null,
				logged : false,
				pseudo: 'User',
				tmpMessage: null,
				messages: []
			}
		},
		methods: {
			async getIp(){
				return await new Promise(resolve => {
					getIPs().then(res => {
						let tmpIp = null
						for (let el of res) {
							if(!el.startsWith(192)){
								this.myIp = el
								tmpIp = el.split('.').join('')
							}
						}
						resolve(tmpIp)
					})
				})
			},
			async connectSocket(theIp){
				if(theIp === null) return false
				let namespace = '/'+theIp
				return await new Promise(resolve => {
					// ~ DEV
					if(import.meta.env.MODE === "development" ){
						this.socket = io('localhost:8088'+namespace, {
							"force new connection" : true,
							"reconnectionAttempts": "Infinity",
							"timeout" : 10000,
							"transports" : ["websocket"]
						})
					}
					// ~ BUILD
					if(import.meta.env.MODE === "production" ){
						this.socket = io.connect(namespace, {
							forceNew:true,
							reconnection: true,
							reconnectionDelay: 500,
							reconnectionDelayMax : 5000,
							reconnectionAttempts: 99999
						});
					}

					this.socket.on('welcome', (pseudo) => {
						this.pseudo = pseudo
					})

					this.socket.on('newMessage', (pseudo, message, date) => {
						this.messages.push({
							pseudo: pseudo,
							message: message,
							timer: this.getTime(date),
							isMine: false
						})
						this.scrollChat()
						notifSound.play()
					})

					resolve()
				})
			},
			sendMessage(){
				if(this.tmpMessage !== '' && this.tmpMessage !== null){
					this.socket.emit('messageSent', this.pseudo, this.tmpMessage);
					this.messages.push({
						pseudo: this.pseudo,
						message: this.tmpMessage,
						timer: this.getTime(null),
						isMine: true
					})
					this.tmpMessage = ''
					this.scrollChat()
					this.$refs.messInput.focus()
				}
			},
			getTime(date){
				let tmpDate = ( date != null ? new Date(date) : new Date())
				let hour = (tmpDate.getHours() > 9 ? tmpDate.getHours() : '0'+tmpDate.getHours() ),
					minute = (tmpDate.getMinutes() > 9 ? tmpDate.getMinutes() : '0'+tmpDate.getMinutes() ),
					secondes = (tmpDate.getSeconds() > 9 ? tmpDate.getSeconds() : '0'+tmpDate.getSeconds() )
				let time = hour + ":" + minute + ":" + secondes
				return time
			},
			messageChecker(content){
				let messageFilter = content.replace(/(<([^>]+)>)/gi, "");
					messageFilter = messageFilter.replace(/((http|https):\/\/[^\s]+)/g, "<a href='$1' target='_blank'>$1</a>")
				return messageFilter
			},
			scrollChat(){
				$("#messages").animate({ scrollTop: $('#messages').height()}, 150);
			}
		},
		async created(){
			let myIp = await this.getIp()
			await this.connectSocket(myIp)
		},
		mounted(){
			this.$refs.messInput.focus()
		}
	}
</script>

<style lang="less">
	@import "assets/styles.less";
</style>