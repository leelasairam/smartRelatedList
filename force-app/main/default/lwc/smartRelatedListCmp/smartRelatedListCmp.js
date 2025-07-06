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
                columns.push({label:result[i],fieldName:i});
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
            this.sObjectData = result;
            this.totalRecordsCount = result.length;
        })
        .catch(error=>{
            console.log(error);
        })
    }

}