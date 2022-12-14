import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuService } from 'src/app/services/menu.service';
import { PersonaService } from 'src/app/services/persona.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-form-invitados',
  templateUrl: './form-invitados.component.html',
  styleUrls: ['./form-invitados.component.scss']
})
export class FormInvitadosComponent implements OnInit {

  public innerWidth: any;
  mobile: boolean = false;

  sTitulo: string = "";
  nIdPersona: number = 0;
  formPersona: FormGroup;

  formUsuario = new FormControl();
  formPassword = new FormControl();
  UsuarioValido: boolean = true; //false

  modeDemo: boolean = true;
  DniActivo: string = ""

  constructor(
    private personaService: PersonaService,
    private menuService: MenuService,

    private router: Router,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
  ) {

    //#region Crear Formulario
    this.formPersona = this.formBuilder.group({
      'nIdPersona': [''],
      'sDNI': ['', Validators.required],

      'sApellidoPaterno': ['', Validators.required],
      'sApellidoMaterno': ['', Validators.required],
      'sNombre': ['', Validators.required],
      'sNombrePersona': [{ value: '', disabled: true }, Validators.required],

      'bEstado': ['']

    });
    //#endregion


  }

  ngOnInit(): void {

    this.innerWidth = window.innerWidth;
    if (this.innerWidth <= 768) {
      this.mobile = true;
    } else {
      this.mobile = false;
    }


    this.DniActivo = this.activatedRoute.snapshot.params['dni'];

    if (this.DniActivo != undefined) {
      this.fnGetDniActive()
    }

    this.modeDemo = (localStorage.getItem("demo") === 'true');

    this.menuService.demo$.subscribe(demo => {
      this.modeDemo = demo;
    })

  }

  //#region Botón Salir/Atras
  fnExit() {
    this.router.navigate(['/', 'invitados'])
  }
  //#endregion


  //#region Detectar cambios en la pantalla
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth <= 768) {
      this.mobile = true;
    } else {
      this.mobile = false;
    }
  }
  //#endregion


  //#region Validaciones
  async fnValidar() {
    let bValidar: boolean = true;

    //Validar que todos los campos tengan datos
    if (this.formPersona.invalid) {
      Swal.fire({
        title: `Ingrese todos los campos obligatorios.`,
        icon: 'warning',
        timer: 1500
      });
      bValidar = false;
    }

    return bValidar;

  }
  //#endregion


  //#region Guardar Invitado
  async fnSave() {

    //Validaciones especificas de algunos campos
    if (!(await this.fnValidar())) {
      return
    }


    let pParametro = [];
    let nOpcion = this.DniActivo == undefined ? 3 : 4; // 3-> Insertar / 4-> Editar

    pParametro.push(this.formPersona.controls["sDNI"].value);
    pParametro.push(this.formPersona.controls["sApellidoPaterno"].value);
    pParametro.push(this.formPersona.controls["sApellidoMaterno"].value);
    pParametro.push(this.formPersona.controls["sNombre"].value);
    pParametro.push(this.formPersona.controls["nIdPersona"].value);

    await this.personaService.fnServicePersona(nOpcion, pParametro).subscribe({
      next: (data) => {

        if (data.cod == 1) {
          Swal.fire({
            title: data.mensaje,
            icon: 'success',
            timer: 3500
          }).then(() => {
            this.fnExit();
          });
        }
        else {
          Swal.fire({
            title: data.mensaje,
            icon: 'warning',
            timer: 5500
          })
        }
      },
      error: (e) => {
        console.error(e)
      }
    });
  }
  //#endregion


  //#region Obtener Nombre Completo
  getDataDni() {
    let param = this.formPersona.controls['sDNI'].value;

    if (param.length >= 8) {
      this.personaService.fnServiceDNI(param).subscribe({
        next: (data: any) => {

          this.formPersona.controls["sNombrePersona"].setValue(data.nombre);
          this.fnSplitName(data.nombre)

        }
      })
    }
    else {
      this.formPersona.controls["sNombrePersona"].setValue("");
    }
  }
  //#endregion


  //#region Asignar Nombres por Partes
  fnSplitName(nombreParam: string) {

    let nombreArray = nombreParam.split(" ")
    let sNombres: string = ""

    this.formPersona.controls["sApellidoPaterno"].setValue(nombreArray[0]);
    this.formPersona.controls["sApellidoMaterno"].setValue(nombreArray[1]);

    for (let i = 2; i < nombreArray.length; i++) {
      sNombres = sNombres + nombreArray[i] + " "
    }

    this.formPersona.controls["sNombre"].setValue(sNombres.trim());

  }
  //#endregion


  //#region Login
  async fnLogin() {

    let pParametro = [];
    let nOpcion = 6

    pParametro.push(this.formUsuario.value);
    pParametro.push(this.formPassword.value);

    await this.personaService.fnServicePersona(nOpcion, pParametro).subscribe({
      next: (data) => {

        if (data.cod == 1) {
          this.UsuarioValido = true
        }
        else {
          this.UsuarioValido = false
          Swal.fire({
            title: `Ingrese los datos correctamente.`,
            icon: 'warning',
            timer: 1500
          });
        }
      },
      error: (e) => {
        console.error(e)
      }
    });
  }
  //#endregion


  //#region Obtener Datos desde Dni
  fnGetDataDni() {
    let paramDni = this.formPersona.controls['sDNI'].value;

    if (paramDni.length >= 8) {
      this.personaService.fnServiceDNI(paramDni).subscribe({
        next: (response: any) => {

          if (response.success == true) {
            this.formPersona.controls["sNombrePersona"].setValue(response.data.nombre_completo);

            this.formPersona.controls["sApellidoPaterno"].setValue(response.data.apellido_materno);
            this.formPersona.controls["sApellidoMaterno"].setValue(response.data.apellido_paterno);
            this.formPersona.controls["sNombre"].setValue(response.data.nombres);
          }

        }
      })
    }
    else {
      this.formPersona.controls["sNombrePersona"].setValue("");
    }

  }
  //#endregion


  //#region Obtener Datos desde Dni
  async fnGetDniActive() {

    let pParametro = [];
    let nOpcion = 2

    this.formPersona.controls["sDNI"].setValue(this.DniActivo);
    pParametro.push(this.DniActivo);

    await this.personaService.fnServicePersona(nOpcion, pParametro).subscribe({
      next: (data) => {
        
        this.formPersona.controls["nIdPersona"].setValue(data[0].nIdPersona);
        this.formPersona.controls["sNombrePersona"].setValue(data[0].sNombrePersona);
        this.formPersona.controls["sApellidoPaterno"].setValue(data[0].sApellidoPaterno);
        this.formPersona.controls["sApellidoMaterno"].setValue(data[0].sApellidoMaterno);
        this.formPersona.controls["sNombre"].setValue(data[0].sNombre);
        this.formPersona.controls["bEstado"].setValue(data[0].bEstado);

      },
      error: (e) => {
        console.error(e)
      }
    });


  }
  //#endregion

  
}
