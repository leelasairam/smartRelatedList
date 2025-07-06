import { LightningElement, api, track } from 'lwc';
import getFieldLabel from '@salesforce/apex/smartRelatedListController.getFieldLabel';
import getData from '@salesforce/apex/smartRelatedListController.getData';

export default class SmartRelatedListCmp extends LightningElement {
    @api recordId;
    @api objectName;
    @api fieldsToDisplay;
    @api filters;
    @api buttons;
    @api parentLookupField;
    @api relatedListName;
    @api clcikableField;

    buttonsList;
    fieldsToDisplayList;
    @track cols = [];
    @track sObjectData = [];
    totalRecordsCount;
    

    connectedCallback(){
        console.log('recordId',this.recordId);
        this.buttonsList = this.buttons?.split(',');
        this.fieldsToDisplayList = this.fieldsToDisplay?.split(',');
        this.getFieldLabelForAPINames();
        this.fetchData();
    }

    async getFieldLabelForAPINames(){
        let columns = [];
        await getFieldLabel({objectApiName:this.objectName,fieldAPINames:this.fieldsToDisplayList})
        .then(result=>{
            console.log('fields',result);
            for(let i in result){
                if(i!='Id' && i!='id'){
                    if(i!=this.clcikableField){
                        columns.push({label:result[i],fieldName:i});
                    }
                    else if(i==this.clcikableField){
                        columns.push({
                            label: i,
                            fieldName: 'recordLink',
                            type: 'url',
                            typeAttributes: { label: { fieldName: i }, target: '_blank' }
                        })
                    }
                }
            }
            this.cols  = columns;
        })
        .catch(error=>{
            console.log(error);
        })
        
    }

    async fetchData(){
        const query = `SELECT ${this.fieldsToDisplay} FROM ${this.objectName} WHERE ${this.parentLookupField} = '${this.recordId}' AND ${this.filters}`;
        console.log('query',query,this.cols);
        await getData({q:query})
        .then(result=>{
            console.log('data',result);
            this.sObjectData = result.map(res=>({...res,recordLink:'/'+res.Id}));
            this.totalRecordsCount = result.length;
        })
        .catch(error=>{
            console.log(error);
        })
    }

    handleButtonActions(event){
        const btn = event.target.dataset.btn;
        const container = this.refs.dataTableDiv;
        const selectedRecords =  container.querySelector("lightning-datatable").getSelectedRows();
        const selectedRecordIds = selectedRecords?.map(record=>(record.Id));
        const selectedRecordSize = selectedRecordIds.length;
        console.log('selectedRecords',selectedRecords,selectedRecordIds);
        console.log('button',btn);
        
        //Contact Edit
        if(btn==='Edit' && this.objectName === 'Contact'){
            console.log('Clicked on Contact edit');
        }
        //Case Edit
        else if(btn==='Edit' && this.objectName === 'Case'){
            console.log('Clicked on Case edit');
        }
        //Contact New
        else if(btn==='New' && this.objectName === 'Case'){
            console.log('Clicked on Case New');
        }
        
    }

}