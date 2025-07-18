public class smartRelatedListController {
    
    @AuraEnabled(cacheable=true)
    public static Map<String,String> getFieldLabel(String objectApiName, list<String>fieldAPINames) {
        
        map<String,String>fieldLabelAPINameMap = new map<String,String>();
        // Get the object describe
        Schema.SObjectType objType = Schema.getGlobalDescribe().get(objectApiName);
        if (objType == null) return null;
    
        // Get field map
        Map<String, Schema.SObjectField> fieldsMap = objType.getDescribe().fields.getMap();
        
        for(String fieldApiName : fieldAPINames){
            Schema.SObjectField field = fieldsMap.get(fieldApiName);
            fieldLabelAPINameMap.put(fieldApiName,field.getDescribe().getLabel());
        }
        
        return fieldLabelAPINameMap;
    }
    
    @AuraEnabled(cacheable=true)
    public static list<sObject> getData(String q,Integer refreshHits){
        list<sobject>data = database.query(q);
        return data;
    }
    
    @AuraEnabled(cacheable=true)
    public static String getObjName(String recordId){
        Schema.SObjectType objType = Id.valueOf(recordId).getSObjectType();
        Schema.DescribeSObjectResult describeResult = objType.getDescribe();
        return describeResult.getLabel();//returns object name
    }
    
    

}