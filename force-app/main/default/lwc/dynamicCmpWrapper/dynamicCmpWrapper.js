import { LightningElement,api } from 'lwc';

export default class DynamicCMPWrapper extends LightningElement {
    @api componentname;
    @api params;
    componentConstructor;

    async connectedCallback() {
        console.log('componentname',this.componentname);
        const cmpRenderer = `c/${this.componentname}`;
        const ctor = await import(cmpRenderer);
        this.componentConstructor = ctor.default;
  }
}