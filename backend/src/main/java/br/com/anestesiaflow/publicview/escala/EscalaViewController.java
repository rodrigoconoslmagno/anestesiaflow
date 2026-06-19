package br.com.anestesiaflow.publicview.escala;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.util.MultiValueMap;

import br.com.anestesiaflow.escala.dto.EscalaSemanaDTO;
import br.com.anestesiaflow.escala.service.EscalaService;
import br.com.anestesiaflow.medico.dto.MedicoResponseDTO;
import br.com.anestesiaflow.medico.service.MedicoService;
import br.com.anestesiaflow.publicview.BasePublicController;

@RestController
@RequestMapping("/escala")
public class EscalaViewController implements BasePublicController {
    
	private final MedicoService medicoService;
	private final EscalaService escalaService;
	private final Map<String, Object> filtrosMedico = new HashMap<>();
	
	public EscalaViewController(MedicoService medicoService, EscalaService escalaService) {
		this.medicoService = medicoService;
		this.escalaService = escalaService;
		filtrosMedico.put("especialidades", Arrays.asList(1));
	}
	
    @GetMapping("/medicos")
	public ResponseEntity<List<MedicoResponseDTO>> listar(@RequestParam(required = false) MultiValueMap<String, String> filtros) {
        return ResponseEntity.ok(medicoService.listar(normalizarFiltros(filtros)));
    }
    
    @GetMapping("/escalassemanais")
    public ResponseEntity<List<EscalaSemanaDTO>> escalas(@RequestParam int medicoId, 
    				@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data){
    	return ResponseEntity.ok(escalaService.listarSemanasMedicos(medicoId, data));
    }

    private Map<String, Object> normalizarFiltros(MultiValueMap<String, String> filtros) {
        Map<String, Object> retorno = new HashMap<>();

        if (filtros == null || filtros.isEmpty()) {
            retorno.put("especialidades", Arrays.asList(1));
            return retorno;
        }

        filtros.forEach((chave, valores) -> {
            if (valores == null || valores.isEmpty()) {
                return;
            }

            if (chave.startsWith("especialidades")) {
                retorno.put("especialidades", valores.stream()
                        .flatMap(valor -> Arrays.stream(valor.split(",")))
                        .map(String::trim)
                        .filter(valor -> !valor.isEmpty())
                        .map(Integer::valueOf)
                        .toList());
            } else {
                retorno.put(chave, valores.size() == 1 ? valores.get(0) : valores);
            }
        });

        if (!retorno.containsKey("especialidades")) {
            retorno.put("especialidades", Arrays.asList(1));
        }

        return retorno;
    }
}
