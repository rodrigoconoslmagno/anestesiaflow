package br.com.anestesiaflow.plantao.controller;

import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import br.com.anestesiaflow.plantao.dto.EscalaPlantaoDTO;
import br.com.anestesiaflow.plantao.service.PlantaoService;

@RestController
@RequestMapping("/plantao")
public class PlantaoController {
	
	@Autowired
	private PlantaoService plantaoService;
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PLANTAO_ACESSAR)")
	@PostMapping("/listar")
	public ResponseEntity<List<EscalaPlantaoDTO>> listarDia(@Validated @RequestBody LocalDate data) {
		return ResponseEntity.ok(plantaoService.listarPorData(data));
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PLANTAO_ALTERAR)")
	@PostMapping
	public ResponseEntity<EscalaPlantaoDTO> criar(@Validated @RequestBody EscalaPlantaoDTO dto) {
		return ResponseEntity.ok(plantaoService.salvar(dto));
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PLANTAO_ARQUIVAR)")
	@PostMapping("/arquivar")
	public ResponseEntity<Integer> arquivar(@Validated @RequestBody LocalDate dataEscala) {
		return ResponseEntity.ok(plantaoService.arquivarPlantao(dataEscala));
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PLANTAO_ACESSAR)")
	@PostMapping("/arquivado")
	public ResponseEntity<Boolean> arquivado(@Validated @RequestBody LocalDate dataEscala) {
		return ResponseEntity.ok(plantaoService.existeArquivo(dataEscala));
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PLANTAO_ACESSAR)")
	@PostMapping("/plantoes")
	public ResponseEntity<List<LocalDate>> listarPlantoes(@Validated @RequestBody LocalDate data) {
		LocalDate inicio = LocalDate.of(data.getYear(), data.getMonth(), 1);
	    LocalDate fim = inicio.withDayOfMonth(inicio.lengthOfMonth());
	    
	    List<LocalDate> datas = plantaoService.datasPlantao(inicio, fim);
	                                        
	    return ResponseEntity.ok(datas);
	}
}