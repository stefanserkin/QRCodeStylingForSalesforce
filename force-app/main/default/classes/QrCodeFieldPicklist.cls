/***********************************************************************
 * @license
 * MIT License
 * Copyright (c) 2026 SerkinSolutions
 * See the LICENSE file in the project root for full license text.
 * 
 * @description 
 * A picklist of record fields for use in qrCode design time attributes
 * 
 * @date 2026
 * @author SerkinSolutions
 ***********************************************************************/
global virtual with sharing class QrCodeFieldPicklist extends VisualEditor.DynamicPickList {

    private static final String ID_FIELD = 'Id';
    private static final String NAME_FIELD = 'Name';
    private static final String SUBJECT_FIELD = 'Subject';
    @TestVisible private static final String INVALID_CONTEXT_VALUE = '__INVALID_CONTEXT__';
    
    private VisualEditor.DesignTimePageContext ctx;

    global QrCodeFieldPicklist(VisualEditor.DesignTimePageContext context) {
        this.ctx = context;
    }

    protected virtual String getEntityName() {
        return (ctx == null) ? null : ctx.entityName;
    }

    global override VisualEditor.DataRow getDefaultValue() {
        String entityName = getEntityName();

        if (String.isBlank(entityName)) {
            return new VisualEditor.DataRow(INVALID_CONTEXT_VALUE, INVALID_CONTEXT_VALUE);
        }

        Schema.SObjectType sObjType = Schema.getGlobalDescribe().get(entityName);
        if (sObjType == null) {
            return new VisualEditor.DataRow(INVALID_CONTEXT_VALUE, INVALID_CONTEXT_VALUE);
        }

        Map<String, Schema.SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();

        String defaultField = ID_FIELD;
        if (fieldMap.containsKey(NAME_FIELD)) {
            defaultField = NAME_FIELD;
        } else if (fieldMap.containsKey(SUBJECT_FIELD)) {
            defaultField = SUBJECT_FIELD;
        }
        return new VisualEditor.DataRow(defaultField, defaultField);
    }

    global override VisualEditor.DynamicPickListRows getValues() {
        VisualEditor.DynamicPickListRows rows = new VisualEditor.DynamicPickListRows();

        String entityName = getEntityName();
        if (String.isBlank(entityName)) {
            rows.addRow(new VisualEditor.DataRow(INVALID_CONTEXT_VALUE, INVALID_CONTEXT_VALUE));
            return rows;
        }

        Schema.SObjectType sObjType = Schema.getGlobalDescribe().get(entityName);
        if (sObjType == null) {
            rows.addRow(new VisualEditor.DataRow(INVALID_CONTEXT_VALUE, INVALID_CONTEXT_VALUE));
            return rows;
        }

        List<FieldOption> options = new List<FieldOption>();

        Map<String, Schema.SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();
        for (Schema.SObjectField field : fieldMap.values()) {
            Schema.DescribeFieldResult dfr = field.getDescribe();

            if (!dfr.isAccessible()) continue;
            if (!isStringRenderableType(dfr.getType())) continue;

            String apiName = dfr.getName();
            String label = dfr.getLabel() + ' (' + apiName + ')';

            options.add(new FieldOption(label, apiName));
        }

        options.sort();
        for (FieldOption opt : options) {
            rows.addRow(new VisualEditor.DataRow(opt.label, opt.value));
        }

        return rows;
    }

    global override Boolean isValid(Object value) {
        return true;
    }

    private static Boolean isStringRenderableType(Schema.DisplayType t) {
        switch on t {
            when String,
                 TextArea,
                 Phone,
                 Email,
                 Url,
                 Id,
                 Boolean,
                 Integer,
                 Long,
                 Double,
                 Currency,
                 Percent,
                 Date,
                 DateTime,
                 Time,
                 Picklist,
                 MultiPicklist,
                 EncryptedString {
                return true;
            }
            when else {
                return false;
            }
        }
    }

    global class FieldOption implements Comparable {
        global String label;
        global String value;

        global FieldOption(String label, String value) {
            this.label = label;
            this.value = value;
        }

        global Integer compareTo(Object other) {
            FieldOption o = (FieldOption)other;
            String a = (label == null) ? '' : label.toLowerCase();
            String b = (o.label == null) ? '' : o.label.toLowerCase();
            return a.compareTo(b);
        }
    }

}