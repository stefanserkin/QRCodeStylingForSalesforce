@IsTest
private class QrCodeFieldPicklist_Test {

    private class TestablePicklist extends QrCodeFieldPicklist {
        private String entityNameOverride;

        TestablePicklist(String entityNameOverride) {
            super(null);
            this.entityNameOverride = entityNameOverride;
        }

        protected override String getEntityName() {
            return entityNameOverride;
        }
    }

    @IsTest
    static void testDefaultValueWhenEntityIsContact() {
        QrCodeFieldPicklist pl = new TestablePicklist('Contact');
        VisualEditor.DataRow row = pl.getDefaultValue();
        System.Assert.areEqual('Name', (String) row.getValue(), 'Contact has Name; default value should be Name');
        System.Assert.areEqual('Name', row.getLabel(), 'Default label should be Name');
    }

    @IsTest
    static void testDefaultValueWhenEntityInvalid() {
        QrCodeFieldPicklist pl = new TestablePicklist('NotARealObject__c');
        VisualEditor.DataRow row = pl.getDefaultValue();
        System.Assert.areEqual(QrCodeFieldPicklist.INVALID_CONTEXT_VALUE, (String) row.getValue(), 'Invalid entity should warn user');
        System.Assert.areEqual(QrCodeFieldPicklist.INVALID_CONTEXT_VALUE, row.getLabel(), 'Invalid entity default label should warn user');
    }

    @IsTest
    static void testGetDefaultValueInvalidObjectFallsBackToName() {
        QrCodeFieldPicklist pl = new TestablePicklist('NotARealObject__c');
        VisualEditor.DataRow row = pl.getDefaultValue();
        System.Assert.areEqual(QrCodeFieldPicklist.INVALID_CONTEXT_VALUE, (String) row.getValue());
    }

    @IsTest
    static void testGetDefaultValueNullEntityFallsBackToName() {
        QrCodeFieldPicklist pl = new TestablePicklist(null);
        VisualEditor.DataRow row = pl.getDefaultValue();
        System.Assert.areEqual(QrCodeFieldPicklist.INVALID_CONTEXT_VALUE, (String) row.getValue());
    }

    @IsTest
    static void testGetDefaultValueUsesNameWhenPresent() {
        QrCodeFieldPicklist pl = new TestablePicklist('Account');
        VisualEditor.DataRow row = pl.getDefaultValue();
        System.Assert.areEqual('Name', (String) row.getValue());
        System.Assert.areEqual('Name', row.getLabel());
    }

    @IsTest
    static void testGetDefaultValueUsesSubjectWhenNoName() {
        QrCodeFieldPicklist pl = new TestablePicklist('Case');
        VisualEditor.DataRow row = pl.getDefaultValue();
        System.Assert.areEqual('Subject', (String) row.getValue());
        System.Assert.areEqual('Subject', row.getLabel());
    }

    @IsTest
    static void testGetValuesUseCanonicalCasing() {
        QrCodeFieldPicklist pl = new TestablePicklist('Contact');
        List<VisualEditor.DataRow> dataRows = pl.getValues().getDataRows();

        System.Assert.isTrue(
            dataRows.size() > 2,
            'Expected multiple fields for Contact, not just Name and Id'
        );

        Map<String, String> canonicalByLower = new Map<String, String>();
        for (Schema.SObjectField f : Schema.SObjectType.Contact.fields.getMap().values()) {
            Schema.DescribeFieldResult dfr = f.getDescribe();
            canonicalByLower.put(dfr.getName().toLowerCase(), dfr.getName());
        }

        Boolean foundFirstName = false;

        for (VisualEditor.DataRow r : dataRows) {
            String value = (String) r.getValue();
            System.Assert.isNotNull(value, 'Picklist value should not be null');

            String canonical = canonicalByLower.get(value.toLowerCase());
            System.Assert.isNotNull(
                canonical,
                'Picklist returned a value not found on Contact: ' + value
            );

            System.Assert.areEqual(
                canonical,
                value,
                'Field API name casing mismatch. Expected "' + canonical + '" but got "' + value + '"'
            );

            if (value == 'FirstName') {
                foundFirstName = true;
            }
        }

        System.Assert.isTrue(
            foundFirstName,
            'Expected Contact.FirstName to be present and correctly cased'
        );
    }

    @IsTest
    static void testGetValuesExcludesReferenceTypes() {
        QrCodeFieldPicklist pl = new TestablePicklist('Contact');
        List<VisualEditor.DataRow> dataRows = pl.getValues().getDataRows();

        for (VisualEditor.DataRow r : dataRows) {
            String v = (String)r.getValue();
            System.Assert.areNotEqual('OwnerId', v, 'Reference fields like OwnerId should be excluded');
            System.Assert.areNotEqual('AccountId', v, 'Reference fields like AccountId should be excluded');
        }
    }

    @IsTest
    static void testGetValuesForInvalidObjectReturnsInvalidContextRow() {
        QrCodeFieldPicklist pl = new TestablePicklist('NotARealObject__c');
        VisualEditor.DynamicPickListRows rows = pl.getValues();
        List<VisualEditor.DataRow> dataRows = rows.getDataRows();

        System.Assert.areEqual(1, dataRows.size(), 'Expected a single sentinel row for invalid entity');
        System.Assert.areEqual(
            QrCodeFieldPicklist.INVALID_CONTEXT_VALUE,
            (String) dataRows[0].getValue(),
            'Expected sentinel value for invalid entity'
        );
    }

    @IsTest
    static void testGetValuesForNullEntityReturnsInvalidContextRow() {
        QrCodeFieldPicklist pl = new TestablePicklist(null);
        VisualEditor.DynamicPickListRows rows = pl.getValues();
        List<VisualEditor.DataRow> dataRows = rows.getDataRows();

        System.Assert.areEqual(1, dataRows.size(), 'Expected a single sentinel row for null entity');
        System.Assert.areEqual(
            QrCodeFieldPicklist.INVALID_CONTEXT_VALUE,
            (String) dataRows[0].getValue(),
            'Expected sentinel value for null entity'
        );
    }

    @IsTest
    static void testIsValidAlwaysTrue() {
        QrCodeFieldPicklist pl = new TestablePicklist('Contact');

        System.Assert.areEqual(true, pl.isValid(null));
        System.Assert.areEqual(true, pl.isValid('Anything'));
        System.Assert.areEqual(true, pl.isValid(123));
    }

    @IsTest
    static void testGetEntityNameWithCtxNull() {
        QrCodeFieldPicklist pl = new QrCodeFieldPicklist(null);
        VisualEditor.DynamicPickListRows rows = pl.getValues();
        List<VisualEditor.DataRow> dataRows = rows.getDataRows();

        System.Assert.areEqual(1, dataRows.size(), 'Expected exactly one sentinel row');

        System.Assert.areEqual(
            QrCodeFieldPicklist.INVALID_CONTEXT_VALUE,
            (String) dataRows[0].getValue(),
            'Expected sentinel value when ctx is null'
        );
    }

}