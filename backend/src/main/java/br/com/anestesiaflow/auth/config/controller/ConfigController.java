package br.com.anestesiaflow.auth.config.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.anestesiaflow.configs.dto.ConfigRequestDTO;
import br.com.anestesiaflow.configs.dto.ConfigResponseDTO;
import br.com.anestesiaflow.configs.service.ConfigService;

@RestController
@RequestMapping("/config")
public class ConfigController {

	@Autowired
	public ConfigService configService;
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).CONFIG_ACESSAR)")
	@PostMapping("/listar")
    public ResponseEntity<List<ConfigResponseDTO>> listConfigs() {        
        List<ConfigResponseDTO> configs = configService.getAllConfigs();
        return ResponseEntity.ok(configs);
    }
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).CONFIG_ALTERAR)")
	@PostMapping()
    public ResponseEntity<Void> updateConfigs(@RequestBody List<ConfigRequestDTO> request) {
        configService.saveAllConfigs(request);
        return ResponseEntity.ok().build();
    }
	
}
