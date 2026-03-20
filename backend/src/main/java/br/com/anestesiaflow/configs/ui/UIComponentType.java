package br.com.anestesiaflow.configs.ui;

public enum UIComponentType {
	
	TEXT("text"),
    NUMBER("numeric"),
    TELEPHONE("tel"),
    EMAIL("email"),
    SWITCH(null),
    SELECT(null),
    DATE_PICKER(null);

    private final String defaultInputMode;
    
    private UIComponentType(String defaultInputMode) {
    	this.defaultInputMode = defaultInputMode;
    }

    public String getDefaultInputMode() {
		return defaultInputMode;
	}
    
}
