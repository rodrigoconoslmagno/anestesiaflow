package br.com.anestesiaflow.escala.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import br.com.anestesiaflow.escala.dto.EscalaResumoAnualClinicaResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaResumoAnualMedicoResponseDTO;
import br.com.anestesiaflow.escala.entidade.Escala;

public interface EscalaRelatorioRepository extends JpaRepository<Escala, Integer> {

	@Query(value = "SELECT DISTINCT EXTRACT(YEAR FROM e.data) AS ano " +
            "FROM escala e " +
            "ORDER BY ano DESC", nativeQuery = true)
	List<Integer> findAllAnosEscalas();
	
	@Query(value = """
	        SELECT 
	            coalesce(est.sigla, est.nome) AS estabelecimento,
	            est.icone,
	            est.cor,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 1) AS janeiro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 2) AS fevereiro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 3) AS marco,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 4) AS abril,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 5) AS maio,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 6) AS junho,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 7) AS julho,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 8) AS agosto,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 9) AS setembro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 10) AS outubro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 11) AS novembro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 12) AS dezembro,
	            COUNT(ei.id) AS total_ano
	        FROM 
	            estabelecimento est
	        LEFT JOIN 
	            escalaitem ei ON est.id = ei.estabelecimentoid
	        LEFT JOIN 
	            escala e ON ei.escalaid = e.id and e.medicoid = :medicoId and EXTRACT(YEAR FROM e.data) = :ano
	        GROUP BY 
	            coalesce(est.sigla, est.nome),  est.icone, est.cor
	        ORDER BY 
	            coalesce(est.sigla, est.nome)
	        """, nativeQuery = true)
	    List<EscalaResumoAnualMedicoResponseDTO> findResumoAnualByMedico(@Param("medicoId") int medicoId, @Param("ano") int ano);
	
	@Query(value = """
	        SELECT 
	            m.sigla AS sigla,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 1) AS janeiro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 2) AS fevereiro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 3) AS marco,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 4) AS abril,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 5) AS maio,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 6) AS junho,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 7) AS julho,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 8) AS agosto,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 9) AS setembro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 10) AS outubro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 11) AS novembro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 12) AS dezembro,
	            COUNT(ei.id) AS total_ano
	        FROM 
	            medico m
	        LEFT JOIN 
	            escala e ON e.medicoid = m.id and EXTRACT(YEAR FROM e.data) = :ano
	        LEFT JOIN 
	            escalaitem ei ON ei.escalaid = e.id and ei.estabelecimentoid = :estId
	        GROUP BY 
	            m.sigla, m.dataassociacao
	        ORDER BY 
	            m.dataassociacao
	        """, nativeQuery = true)
	    List<EscalaResumoAnualClinicaResponseDTO> findResumoAnualByClinica(@Param("estId") int medicoId, @Param("ano") int ano);
		
}
