package br.com.anestesiaflow.publicview.plantao;

import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import br.com.anestesiaflow.plantao.dto.EscalaPlantaoDTO;
import br.com.anestesiaflow.plantao.service.PlantaoService;
import br.com.anestesiaflow.publicview.BasePublicController;

@RestController
@RequestMapping("/plantao") 
public class PlantaoViewController implements BasePublicController {
	
	@Autowired
	private PlantaoService plantaoService;
	
	@GetMapping("/plantoes")
	public ResponseEntity<List<LocalDate>> listarPlantoes(@Validated 
				@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
		LocalDate inicio = LocalDate.of(data.getYear(), data.getMonth(), 1);
	    LocalDate fim = inicio.withDayOfMonth(inicio.lengthOfMonth());
	    
	    List<LocalDate> datas = plantaoService.datasPlantao(inicio, fim);
	                                        
	    return ResponseEntity.ok(datas);
	}
	
	@GetMapping("/listar")
	public ResponseEntity<List<EscalaPlantaoDTO>> listarDia(@Validated 
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
		return ResponseEntity.ok(plantaoService.listarPorData(data));
	}
	
}
