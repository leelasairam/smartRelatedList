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
    @api orderBy;
    @api orderASCDESC;
    @api searchableFields;

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
    refreshHits = 0;
    @track pFields = [];
    //excludeFields = ['Id','OwnerId','CreatedById','LastModifiedById','AccountId'];

    modalTittle = '';
    showFlowModal = false;
    flowProps = [];
    flowApiName;
    showDynamicLWcModal = false;
    lwcParams; //{name:'Mark', id:1}

    //initialize component with default false and make true when required.
    @track relatedCmpToggle = {
        SmartRelatedListSearch:false,
    };

    connectedCallback(){
        console.log('recordId',this.recordId);
        this.buttonsList = this.buttons?.split(',').map((btn,index)=>({name:btn,isMenuItem:index<=2 ? false : true}));
        this.fieldsToDisplayList = this.fieldsToDisplay?.split(',').map(i=>{
            if(!i.includes('.')){
                return i;
            }
            else{
                this.pFields.push(i);
                return null;
            }
        }).filter(Boolean);
        this.getFieldLabelForAPINames();
        this.getRecordPageObject();
        this.query = `SELECT ${this.fieldsToDisplay} FROM ${this.objectName} WHERE ${this.parentLookupField} = '${this.recordId}' AND ${this.filters} ORDER BY ${this.orderBy} ${this.orderASCDESC} LIMIT ${this.recordsPerPage} OFFSET ${this.offset}`;
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
                        columns.push({label:result[i],fieldName:i,initialWidth: 180});
                    }
                    else if(i==this.clcikableField){
                        columns.push({
                            label: result[i],
                            fieldName: 'recordLink',
                            type: 'url',
                            initialWidth: 180,
                            typeAttributes: { label: { fieldName: i }, target: '_blank' }
                        })
                    }
                }
            }
            if(this.pFields){
                this.pFields.forEach(i=>{
                    const objName = i.split('.')[0];
                    if(i.split('.')[1]!='Id'){
                        columns.push({label:i.replace(/\./, ' ⤷ ').replace(/_/g, ' ').replace(/__c$/, ''),fieldName:`${objName}Id`,initialWidth: 180,type: 'url',typeAttributes: { label: { fieldName: i.replace(/\./g, '') }, target: '_blank' }});
                    }
                })
            }

            const sequenceCols = [];
            const flexiFields = this.fieldsToDisplay.split(',').map(i=>{
                if(i.includes('.')){
                    return i.split('.')[1]!= 'Id' ? i.replace(/\./g, '') : null;
                }
                else{
                    return i != 'Id' ? i : null;
                }
            }).filter(Boolean);
            
            /*flexiFields.forEach(i=>{
                console.log('flexiField',i);
            })

            columns.forEach(i=>{
                console.log('label',i.label);
            })*/

            flexiFields.forEach(i => {
                const index = columns.findIndex(l =>
                    !l.typeAttributes
                        ? l.fieldName === i
                        : l.typeAttributes.label.fieldName === i
                );
                sequenceCols.push(columns[index]);
            });
            //console.log('sequenceCols',sequenceCols[0]);
            this.cols  = sequenceCols;
        })
        .catch(error=>{
            console.log(error);
        })
        .finally(()=>{
            this.isLoading = false;
        })
        
    }

    async fetchData(){
        console.log('query',this.query,this.cols,'Refresh Hits'+this.refreshHits);
        this.isLoading = true;
        await getData({q:this.query,refreshHits:this.refreshHits})
        .then(result=>{
            console.log('data',result);
            //this.sObjectData = result.map(res=>({...res,recordLink:'/'+res.Id}));

            this.sObjectData = result.map(res => {
            const flat = {
                recordLink: '/' + res.Id
            };

            for (let key in res) {
                const value = res[key];

                if (typeof value === 'object' && value !== null) {
                    
                    for (let nestedKey in value) {
                        if(nestedKey == 'Id'){
                            flat[`${key}${nestedKey}`] = `/${value[nestedKey]}`
                        }
                        else{
                            flat[`${key}${nestedKey}`] = value[nestedKey]; // e.g., OwnerName
                        }
                    }
                } else {
                    flat[key] = value;
                }
            }

                return flat;
            });
            console.log('Print',this.sObjectData[0].OwnerName);
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
        this.query = `SELECT ${this.fieldsToDisplay} FROM ${this.objectName} WHERE ${this.parentLookupField} = '${this.recordId}' AND ${this.filters} ORDER BY ${this.orderBy} ${this.orderASCDESC} LIMIT ${this.recordsPerPage} OFFSET ${this.offset}`;
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
        else if(btn==='New' && this.objectName === 'Contact' && this.recordPageObject === 'Account'){
            console.log('Contact New');
            this.handleNewContact(selectedRecords,selectedRecordIds,selectedRecordSize,btn);
        }
        else if(btn==='New' && this.objectName === 'Contact' && this.recordPageObject === 'Account'){
            console.log('Contact New');
            this.handleNewContact(selectedRecords,selectedRecordIds,selectedRecordSize,btn);
        }
        else if(btn==='Delete' && this.objectName === 'Contact' && this.recordPageObject === 'Account'){
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
        //Search
        else if(btn==='Search'){
            console.log('Clicked on Search');
            this.modalTittle = 'Search'
            this.showDynamicLWcModal = true;
            this.relatedCmpToggle.SmartRelatedListSearch = true;
        }
        else if(btn==='Refresh'){
            this.refresh();
        }
    }

    closeFlow(){
        this.showFlowModal = false;
    }

    closeDynamicLWC(){
        for(let i in this.relatedCmpToggle){
            if(this.relatedCmpToggle[i]){
                this.relatedCmpToggle[i] = false;
            }
        }
        this.showDynamicLWcModal = false;
        console.log(this.relatedCmpToggle['SmartRelatedListSearch'])
    }

    handleFlowStatusChange(event) {
		console.log("flow status", event.detail.status);
		if (event.detail.status === "FINISHED") {
			console.log('Flow Completed');
            this.showFlowModal = false;
            this.toast('Success','Changes saved successfully','success');
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
        this.showFlowModal = true;
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
        this.showFlowModal = true;
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
        this.showFlowModal = true;
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
        this.showFlowModal = true;
    }

    handleDeleteContact(sRecords,sRecordIds,sRecordsCount,btnName){
        if(sRecordsCount==0  && sRecordsCount<1){
            this.toast('Please select atleast one record','','error');
            return;
        }
        this.modalTittle = 'Delete Contact';
        this.flowApiName = 'LWC_Contact_Edit_Form';
        this.flowProps = [{name: "accountId",type: "String",value: this.recordId},{name: "contactDeleteIds",type: "String",value: sRecordIds},{name: "action",type: "String",value: btnName}];
        this.showFlowModal = true;
    }

    hanldeSearch(event){
        const searchInput = event.detail.message;
        this.closeDynamicLWC();
        this.offset = 0;
        this.page = 1;
        this.query = `SELECT ${this.fieldsToDisplay} FROM ${this.objectName} WHERE ${this.parentLookupField} = '${this.recordId}' AND ${searchInput.field} LIKE '%${searchInput.value}%' ORDER BY ${this.orderBy} ${this.orderASCDESC} LIMIT ${this.recordsPerPage} OFFSET ${this.offset}`;
        this.fetchData();
    }

    refresh(){
        this.refreshHits+=1;
        console.log('refreshHits',this.refreshHits);
        this.offset = 0;
        this.page = 1;
        this.query = `SELECT ${this.fieldsToDisplay} FROM ${this.objectName} WHERE ${this.parentLookupField} = '${this.recordId}' AND ${this.filters} ORDER BY ${this.orderBy} ${this.orderASCDESC} LIMIT ${this.recordsPerPage} OFFSET ${this.offset}`;
        this.fetchData();
    }

}