package software.magizhchi.crm.ingestion.domain;

public enum IngestionType {
    API,        // web service: external system POSTs leads with an API key
    WEBHOOK     // Instagram form / Google form / generic webhook POSTs JSON
}
