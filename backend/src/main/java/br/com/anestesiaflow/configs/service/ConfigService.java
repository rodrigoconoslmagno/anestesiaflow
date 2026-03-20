package br.com.anestesiaflow.configs.service;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import br.com.anestesiaflow.auth.config.util.ConfigManager;
import br.com.anestesiaflow.configs.dto.ConfigRequestDTO;
import br.com.anestesiaflow.configs.dto.ConfigResponseDTO;
import br.com.anestesiaflow.configs.entidade.Config;
import br.com.anestesiaflow.configs.entidade.ConfigUI;
import br.com.anestesiaflow.configs.repository.ConfigRepository;
import br.com.anestesiaflow.configs.ui.UIConfig;
import br.com.anestesiaflow.exception.BusinessException;

@Service
public class ConfigService {

	private final ConfigRepository configRepository;
	private final ConfigManager configManager;
	
	public ConfigService(ConfigRepository configRepository, @Lazy ConfigManager configManager) {
		this.configRepository = configRepository;
		this.configManager = configManager;
	}
	
	public Config getConfig(ConfigUI config) {
		return configRepository.findByChave(config.name());
	}
	
	public String getConfigValue(ConfigUI config) {
		Config cfg = configRepository.findByChave(config.name());
		if (cfg != null) {
			return cfg.getValor();
		}
		return null;
	}
	
	
    public List<ConfigResponseDTO> getAllConfigs() {
        Map<String, String> savedValues = configRepository.findAll()
                .stream()
                .collect(HashMap::new, 
                		(map, config) -> map.put(config.getChave(), config.getValor()),
                		HashMap::putAll
                	);

        return Arrays.stream(ConfigUI.values())
        		.map(config -> {
        			try {
                      Field field = config.getClass().getField(config.name());
                      UIConfig meta = field.getAnnotation(UIConfig.class);
                      
                      if (meta == null) {
                    	  return null;
                      }

                      String value = savedValues.getOrDefault(config.name(), null);

                      return new ConfigResponseDTO(
                              config.name(),
                              value,
                              meta.label(),
                              meta.type(),
                              meta.type().getDefaultInputMode(),
                              meta.placeholder(),
                              meta.required()
                         );
                      
                  } catch (NoSuchFieldException e) {
                      throw new BusinessException("Erro ao processar metadados do Enum: " + config.name());
                  }
        		})
        		.filter(java.util.Objects::nonNull)
        		.collect(Collectors.toList());
    }

    @Transactional
    public void saveAllConfigs(List<ConfigRequestDTO> dto) {
        dto.forEach(config -> {
            try {
                ConfigUI.valueOf(config.chave());
                
                Config configBanco = configRepository.findByChave(config.chave());
                if (configBanco == null) {
                	configBanco = new Config();
                	configBanco.setChave(config.chave());
                }
                if (configBanco.getId() != 0 && (config.valor() == null || config.valor().isEmpty())) {
                	configRepository.delete(configBanco);
                } else {
	                configBanco.setValor(config.valor());
	                configRepository.save(configBanco);
                }
                configManager.limparCache();
            } catch (IllegalArgumentException e) {
                // Log ou ignorar chaves que não existem mais no Enum
            }
        });
    }
}