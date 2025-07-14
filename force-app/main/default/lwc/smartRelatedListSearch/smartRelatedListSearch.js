import { LightningElement,api,wire } from 'lwc';
import smartrelatedlistchannel from '@salesforce/messageChannel/smartrelatedlistchannel__c';
import { publish, subscribe,unsubscribe, MessageContext } from 'lightning/messageService'

export default class SmartRelatedListSearch extends LightningElement {
    /*@api searchableFieldsList;

    get fieldOptions(){
        return this.searchableFieldsList.map(i=>({label:i,value:i}));
    }*/
   fieldOptions;
   isLoading = false;

    @wire(MessageContext) messageContext;
    subscription = null;

    connectedCallback(){
        if (!this.subscription) {
            this.subscription = subscribe(this.messageContext, smartrelatedlistchannel, (message) => {
                console.log('smartRelatedListSearch - subscribed',message.message,message.source);
                if(message.source=='smartRelatedListCmp' && message.message == 'send data'){
                    this.fieldOptions = message.data.map(i=>({label:i,value:i}));
                }
            });
        }
        publish(this.messageContext, smartrelatedlistchannel, {message:'connected',source:'smartRelatedListSearch',data:'',key:'Contact'});
        console.log('publish connected');
    }

    disconnectedCallback(){
        this.unsubscribeEvent();
    }

    unsubscribeEvent(){
        if(this.subscription){
            unsubscribe(this.subscription);
            this.subscription = null;
            console.log('✅ smartRelatedListSearch - Unsubscribed from LMS');
        }
    }

    handleSearch(){
        const field = this.template.querySelector('.searchField').value;
        const value = this.template.querySelector('.searchValue').value;
        console.log(field,value);
        this.unsubscribeEvent;
        publish(this.messageContext, smartrelatedlistchannel, {message:'search data',source:'smartRelatedListSearch',data:{field:field,value:value},key:'Contact'});
    }
    
}