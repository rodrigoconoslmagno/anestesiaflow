package br.com.anestesiaflow.auth.config.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import br.com.anestesiaflow.configs.entidade.ConfigUI;
import br.com.anestesiaflow.configs.service.ConfigService;

@Component
public class ConfigManager {

	@Autowired
	private ConfigService configService;
    private final Map<ConfigUI, String> cache = new ConcurrentHashMap<>();
	
    private String getValueBanco(ConfigUI key) {
    	return cache.computeIfAbsent(key, configService::getConfigValue);
    }
    
    public LocalDate getLocalDate(ConfigUI config) {
    	String valorBanco = getValueBanco(config);
    	if (valorBanco == null || valorBanco.isEmpty()) {
    		return null;
    	}
    	
    	return Instant.parse(valorBanco).atZone(ZoneId.systemDefault()).toLocalDate();
    }
    
    public void limparCache() {
    	cache.clear();
    }
}
