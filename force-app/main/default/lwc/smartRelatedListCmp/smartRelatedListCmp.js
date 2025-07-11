import { LightningElement, api, track } from 'lwc';
import getFieldLabel from '@salesforce/apex/smartRelatedListController.getFieldLabel';
import getData from '@salesforce/apex/smartRelatedListController.getData';
import getObjName from '@salesforce/apex/smartRelatedListController.getObjName';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class SmartRelatedListCmp extends LightningElement {
    @api recordId;
    @api objectName;
    @api fieldsToDisplay;
    @api filters;
    @api buttons;
    @api parentLookupField;
    @api relatedListName;
    @api clcikableField;
    @api recordsPerPage;

    recordPageObject='';
    buttonsList;
    fieldsToDisplayList;
    @track cols = [];
    @track sObjectData = [];
    totalRecordsCount='';
    offset = 0;
    query='';
    disableNextButton = false;
    disablePrevButton = false;
    page = 1;
    isLoading = false;

    showModal = false;
    flowProps = [];
    flowApiName;
    modalTittle = '';
    

    connectedCallback(){
        console.log('recordId',this.recordId);
        this.buttonsList = this.buttons?.split(',').map((btn,index)=>({name:btn,isMenuItem:index<=1 ? false : true}));
        this.fieldsToDisplayList = this.fieldsToDisplay?.split(',');
        this.getFieldLabelForAPINames();
        this.getRecordPageObject();
        this.query = `SELECT ${this.fieldsToDisplay} FROM ${this.objectName} WHERE ${this.parentLookupField} = '${this.recordId}' AND ${this.filters} ORDER BY CreatedDate DESC LIMIT ${this.recordsPerPage} OFFSET ${this.offset}`;
        this.fetchData();
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

    async getRecordPageObject(){
        this.isLoading = true;
        await getObjName({recordId:this.recordId})
        .then(result=>{
            this.recordPageObject = result;
        })
        .catch(error=>{
            console.log(error);
        })
        .finally(()=>{
            this.isLoading = false;
        })
    }

    async getFieldLabelForAPINames(){
        this.isLoading = true;
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
        .finally(()=>{
            this.isLoading = false;
        })
        
    }

    async fetchData(){
        console.log('query',this.query,this.cols);
        this.isLoading = true;
        await getData({q:this.query})
        .then(result=>{
            console.log('data',result);
            this.sObjectData = result.map(res=>({...res,recordLink:'/'+res.Id}));
            const recSize = result.length;
            if(this.page==1){
                this.totalRecordsCount = recSize >= this.recordsPerPage ? `${this.recordsPerPage}+` : `${recSize}`;
            }
            this.disableNextButton = (recSize < this.recordsPerPage);
            this.disablePrevButton = (this.page === 1);
        })
        .catch(error=>{
            console.log(error);
        })
        .finally(()=>{
            this.isLoading = false;
        })
    }

    handlePagination(event){
        const btn = event.target.dataset.btn;
        if(btn=='next'){
            this.offset += this.recordsPerPage;
            this.page += 1;
        }
        else if(btn=='prev'){
            this.offset -= this.recordsPerPage;
            this.page -= 1;
        }
        this.query = `SELECT ${this.fieldsToDisplay} FROM ${this.objectName} WHERE ${this.parentLookupField} = '${this.recordId}' AND ${this.filters} ORDER BY CreatedDate DESC LIMIT ${this.recordsPerPage} OFFSET ${this.offset}`;
        this.fetchData();
        const container = this.refs.dataTableDiv;
        container.querySelector("lightning-datatable").selectedRows = [];
    }


    // ### Buttons Logic starts here ###

   handleButtonActions(event){
        const btn = event.target.dataset.btn;
        const container = this.refs.dataTableDiv;
        const selectedRecords =  container.querySelector("lightning-datatable").getSelectedRows() || [];
        const selectedRecordIds = selectedRecords?.map(record=>(record.Id));
        const selectedRecordSize = selectedRecordIds.length;
        console.log('selectedRecords',selectedRecords,selectedRecordIds);
        console.log('button',btn);
        
        //Contact Edit
        if(btn==='Edit' && this.objectName === 'Contact' && this.recordPageObject === 'Account'){
            console.log('Contact Edit');
            this.handleEditContact(selectedRecords,selectedRecordIds,selectedRecordSize,btn);
        }
        //Contact New
        if(btn==='New' && this.objectName === 'Contact' && this.recordPageObject === 'Account'){
            console.log('Contact New');
            this.handleNewContact(selectedRecords,selectedRecordIds,selectedRecordSize,btn);
        }
        if(btn==='New' && this.objectName === 'Contact' && this.recordPageObject === 'Account'){
            console.log('Contact New');
            this.handleNewContact(selectedRecords,selectedRecordIds,selectedRecordSize,btn);
        }
        if(btn==='Delete' && this.objectName === 'Contact' && this.recordPageObject === 'Account'){
            console.log('Contact Delete');
            this.handleDeleteContact(selectedRecords,selectedRecordIds,selectedRecordSize,btn);
        }
        //Case Edit
        else if(btn==='Edit' && this.objectName === 'Case' && this.recordPageObject === 'Account'){
            console.log('Clicked on Case edit');
            this.handleEditCase(selectedRecords,selectedRecordIds,selectedRecordSize,btn);
        }
        //Case New
        else if(btn==='New' && this.objectName === 'Case' && this.recordPageObject === 'Account'){
            console.log('Clicked on Case New');
            this.handleNewCase(selectedRecords,selectedRecordIds,selectedRecordSize,btn);
        }
    }

    closeFlow(){
        this.showModal = false;
    }

    handleFlowStatusChange(event) {
		console.log("flow status", event.detail.status);
		if (event.detail.status === "FINISHED") {
			console.log('Flow Completed');
            this.showModal = false;
            this.toast('Success','Saved successfully','success');
		}
	}

    handleEditCase(sRecords,sRecordIds,sRecordsCount,btnName){
        if(sRecordsCount>1 || sRecordsCount == 0){
            const msg = sRecordsCount == 0 ? 'Select the contact to edit' : 'Select only one contact to edit';
            this.toast(msg,'','error');
            return;
        }
        this.modalTittle = 'Edit Case';
        this.flowApiName = 'LWC_Case_Edit_Form';
        this.flowProps = [
            {
                name: "accountId",
                type: "String",
                value: this.recordId,
            },
            {
                name: "caseId",
                type: "String",
                value: sRecordIds[0],
            },
            {
                name: "action",
                type: "String",
                value: btnName,
            },
        ];
        this.showModal = true;
    }

    handleNewCase(sRecords,sRecordIds,sRecordsCount,btnName){
        this.modalTittle = 'New Case';
        this.flowApiName = 'LWC_Case_Edit_Form';
        this.flowProps = [
            {
                name: "accountId",
                type: "String",
                value: this.recordId,
            },
            {
                name: "caseId",
                type: "String",
                value: '',
            },
            {
                name: "action",
                type: "String",
                value: btnName,
            },
        ];
        this.showModal = true;
    }

    handleNewContact(sRecords,sRecordIds,sRecordsCount,btnName){
        this.modalTittle = 'New Contact';
        this.flowApiName = 'LWC_Contact_Edit_Form';
        this.flowProps = [
            {
                name: "accountId",
                type: "String",
                value: this.recordId,
            },
            {
                name: "contactId",
                type: "String",
                value: '',
            },
            {
                name: "action",
                type: "String",
                value: btnName,
            },
        ];
        this.showModal = true;
    }

    handleEditContact(sRecords,sRecordIds,sRecordsCount,btnName){
        if(sRecordsCount>1 || sRecordsCount == 0){
            const msg = sRecordsCount == 0 ? 'Select the contact to edit' : 'Select only one contact to edit';
            this.toast(msg,'','error');
            return;
        }
        this.modalTittle = 'Edit Contact';
        this.flowApiName = 'LWC_Contact_Edit_Form';
        this.flowProps = [{name: "accountId",type: "String",value: this.recordId},{name: "contactId",type: "String",value: sRecordIds[0]},{name: "action",type: "String",value: btnName}];
        this.showModal = true;
    }

    handleDeleteContact(sRecords,sRecordIds,sRecordsCount,btnName){
        this.modalTittle = 'Delete Contact';
        this.flowApiName = 'LWC_Contact_Edit_Form';
        this.flowProps = [{name: "accountId",type: "String",value: this.recordId},{name: "contactDeleteIds",type: "String",value: sRecordIds},{name: "action",type: "String",value: btnName}];
        this.showModal = true;
    }

}