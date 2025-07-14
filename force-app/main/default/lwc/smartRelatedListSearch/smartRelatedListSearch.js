import { LightningElement,api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getFieldLabel from '@salesforce/apex/smartRelatedListController.getFieldLabel';

export default class SmartRelatedListSearch extends LightningElement {
   
   @api fieldoptions;
   @api objectname;
   isLoading = false;
   picklistOptions;

    connectedCallback(){
        this.fetchLableNames();
    }

    async fetchLableNames(){
        this.isLoading = true
        const options = [];
        getFieldLabel({objectApiName:this.objectname,fieldAPINames:this.fieldoptions.split(',')})
        .then(result=>{
            for(let i in result){
                options.push({label:result[i],value:i})
            }
            this.picklistOptions = options;
        })
        .catch(error=>{
            console.log(error);
        })
        .finally(()=>{
            this.isLoading = false;
        })
    }

    toast(title,msg,varient) {
        const event = new ShowToastEvent({
            title: title,
            message: msg,
            variant: varient,
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

    handleSearch(){
        const field = this.template.querySelector('.searchField').value;
        const value = this.template.querySelector('.searchValue').value;
        console.log(field,value);
        if(!field || !value || value.length<3){
            this.toast('Please fill all inputs','For value enter alteast 3 chars','error');
            return;
        }

        this.dispatchEvent(new CustomEvent('searchinput', {
            detail: {
                message: {field:field,value:value}
            }
        }));
    }
    
}