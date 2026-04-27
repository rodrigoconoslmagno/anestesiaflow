package br.com.anestesiaflow.paciente.entidade;

import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonBackReference;
import br.com.anestesiaflow.framework.persistence.BaseEntity;
import br.com.anestesiaflow.medico.model.Medico;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "pacienteprocedimento")
public class PacienteProcedimento extends BaseEntity<Integer>{

	private static final long serialVersionUID = -2747227390638791449L;
	
	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pacienteid", nullable = false)
    @JsonBackReference
    private Paciente paciente;
	@Column(name = "dataprocedimento")
	private LocalDate dataProcedimento;
	@Column
	private String procedimento;
	@Column
	private String cirurgiao;
	@Column
	private Medico medico;
	
	public Paciente getPaciente() {
		return paciente;
	}
	
	public void setPaciente(Paciente paciente) {
		this.paciente = paciente;
	}
	
	public LocalDate getDataProcedimento() {
		return dataProcedimento;
	}
	
	public void setDataProcedimento(LocalDate dataProcedimento) {
		this.dataProcedimento = dataProcedimento;
	}
	
	public String getProcedimento() {
		return procedimento;
	}
	
	public void setProcedimento(String procedimento) {
		this.procedimento = procedimento;
	}
	
	public String getCirurgiao() {
		return cirurgiao;
	}
	
	public void setCirurgiao(String cirurgiao) {
		this.cirurgiao = cirurgiao;
	}
	
	public Medico getMedico() {
		return medico;
	}
	
	public void setMedico(Medico medico) {
		this.medico = medico;
	}
}