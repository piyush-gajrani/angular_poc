import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../../services/language.service';
import { Observable, Subscription, mergeMap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { CommonMatModule } from '../../../../shared-components/common-module/common-mat.module';
import { FormControl, FormGroup } from '@angular/forms';
import { ValidatorsService } from '../../../../shared-components/validation-service/validation.service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Store, select } from '@ngrx/store';
import { AppThemeState } from '../../../../../state-management/app.state';
import { selectTheme } from '../../../../../state-management/change-theme/change-theme.selector';
import { NgxFileDropModule } from 'ngx-file-drop';
import {
  NgxFileDropEntry,
  FileSystemFileEntry,
  FileSystemDirectoryEntry,
} from 'ngx-file-drop';
import { BreadcrumbsComponent } from '../../../../shared-components/breadcrumbs/breadcrumbs.component';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { CreateOrderService } from '../services/create-order.service';
import { SharedService } from '../../../services/shared-service';
import {
  NamesModel,
  getAllNamesModel,
  Orders,
  getPreviousOrdersModel,
  getAllTags,
  getOrderSettings,
  settings,
  getAllApiResponse,
  data,
  userDetailResponse,
  userDetailData,
  createOrderForm,
  departmentsResponse,
  createOrderApiResponse,
  uploadDocumentResponse,
} from '../model/order.model';
import { sites, sitesResponse } from '../../../models/model.interfaces';
import { MatSelectChange } from '@angular/material/select';
import { LocalStorageService } from '../../../../../core/services/local-storage.service';
import { MatDialog } from '@angular/material/dialog';
import { PreviewModalComponent } from './modals/preview-modal/preview-modal.component';
import { LotSectionComponent } from '../lot-section/lot-section.component';
import { Validators } from '@angular/forms';
import { ErrorModalComponent } from './modals/error-modal/error-modal.component';
import { selectRole } from '../../../../../state-management/roles-and-permissions/roles-and-permissions.selector';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-order',
  templateUrl: './create-order.component.html',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    AsyncPipe,
    CommonMatModule,
    RouterOutlet,
    RouterLink,
    MatDatepickerModule,
    NgxFileDropModule,
    BreadcrumbsComponent,
    LotSectionComponent,
  ],
  styleUrls: ['./create-order.component.scss'],
})
export class CreateOrdersComponent implements OnInit {
  // @ViewChild('parent') slider: ElementRef | undefined;
  orderLabels: any;
  // isLoading: boolean = false;
  isSlideChecked: boolean = false;
  minDate: Date = new Date();

  orderForSearchStr: string = '';
  proxyRequestorSearchStr: string = '';
  attendantSearchStr: string = '';
  previousOrderIdSearchStr: string = '';
  bondingWaferPreviousOrderSearchStr: string = '';

  previousOrders: Orders[] = [];
  filterPrevOrderList: Orders[] = [];
  engineerIncharges: NamesModel[] = [];
  previousOrderIds: Orders[] = [];
  orderForUsersArray: NamesModel[] = [];
  filterProxyUsersList: NamesModel[] = [];
  filterAttendantList: NamesModel[] = [];
  filterOrderIdList: Orders[] = [];
  filterBondingWaferOrderIdList: Orders[] = [];
  businessUnits: data[] = [];
  tagNames: string[] = [];
  waferTypes: data[] = [];
  sites: sites[] = [];
  userDetails: any;
  organizationId: number = 1;
  stakeHolderEmailsArray: string[] = [];
  approverManager: any;
  confidentialLevelArray: settings[] = [];
  internalPriorityArray: settings[] = [];
  createOrderFormValues: createOrderForm = {} as createOrderForm;
  prevOrderDetail: any;

  departments: data[] = [];
  pageDetails: any = {
    name: 'Create Order',
    path: 'Order - Create Order',
  };

  form!: FormGroup;
  orderLotModel: any;
  selectedWafer: any;
  selectedOrderData: any;
  savingOrder: boolean = false;

  initializeForm() {
    this.selectedSite = this.sites.filter(
      (site) => site.id === this.userDetails.siteId
    )[0];
    this.form = new FormGroup({
      prevOrder: new FormControl(''),
      siteName: new FormControl(
        this.userDetails.siteId,

        [ValidatorsService.selectRequired]
      ),
      orderTitle: new FormControl('', [
        Validators.required,
        ValidatorsService.required,
      ]),
      description: new FormControl(),
      proxyOrder: new FormControl(false),
      proxyRequestor: new FormControl(),
      previouslyOrdered: new FormControl(false),
      previousOrderId: new FormControl(),

      shipOutside: new FormControl(),
      attendantDropdown: new FormControl(),
      attendantName: new FormControl(),
      attendantPhone: new FormControl(null, [ValidatorsService.validPhone]),
      department: new FormControl(),
      country: new FormControl(),
      address: new FormControl(
        `NanoFab 300 South
255 Fuller Road, Suite 214,
Albany, NY 12203`
      ),

      projectNumberType: new FormControl(0, [
        Validators.required,
        ValidatorsService.required,
      ]),
      projectNumber: new FormControl('', [
        Validators.required,
        ValidatorsService.required,
      ]),
      phone: new FormControl({ value: this.userDetails.phone, disabled: true }),
      departmentCode: new FormControl(),
      engineerInCharge: new FormControl(),
      orderFor: new FormControl(this.userDetails.id),
      tagName: new FormControl(),
      approverManager: new FormControl({
        value: this.userDetails.approverManager,
        disabled: true,
      }),
      businessUnit: new FormControl('', [
        Validators.required,
        ValidatorsService.required,
      ]),
      employeeID: new FormControl({
        value: this.userDetails.employeeId,
        disabled: true,
      }),
      expediteFlag: new FormControl(0),
      confidentialLevel: new FormControl(0),
      internalPriority: new FormControl(2),
      waferProvidedBy: new FormControl(this.userDetails.siteId),
      waferType: new FormControl(),
      lotID: new FormControl(),
      comingFromAddress: new FormControl(),
      isUsingBondedWafers: new FormControl(0),
      bondingWaferProvidedBy: new FormControl(this.userDetails.siteId),
      bondingWaferType: new FormControl(),
      stakeholderEmail: new FormControl('', [ValidatorsService.emailValidator]),

      structureImage: new FormControl(),
      bondingWaferPreviousOrder: new FormControl(),
      desiredDeliveryDate: new FormControl(),
    });
  }

  theme$: Observable<string>;
  themeSubscription: Subscription = new Subscription();
  isDarkThemeEnabled: boolean = true;
  fileDropClass: string = 'dropZone';
  isFileUploaded: boolean = true;

  roleSubscription: Subscription = new Subscription();
  role$: Observable<any>;
  selectedRole: any = {};

  constructor(
    private languageService: LanguageService,
    private store: Store<AppThemeState | any>,
    private orderService: CreateOrderService,
    private sharedService: SharedService,
    private localStorageService: LocalStorageService,
    public dialog: MatDialog,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.languageService.localizationText.subscribe((data: any) => {
      this.orderLabels = data;
      this.pageDetails = {
        name: this.orderLabels.ORDER_CREATE_ORDER_BREADCRUMB?.length
          ? this.orderLabels.ORDER_CREATE_ORDER_BREADCRUMB[0]
          : 'Create Order',
        path: this.orderLabels.ORDER_CREATE_ORDER_BREADCRUMB?.length
          ? this.orderLabels.ORDER_CREATE_ORDER_BREADCRUMB[1]
          : 'Order - Create Order',
      };
    });

    this.theme$ = this.store.pipe(select(selectTheme));
    this.role$ = this.store.pipe(select(selectRole));
  }
  onSelectPrevOrder(event: any) {
    let sub: Subscription = this.orderService.getOrder(event.id).subscribe({
      next: (res: getPreviousOrdersModel) => {
        if (res.data) {
          this.selectedOrderData = res.data;
        }
        sub.unsubscribe();
      },
      error: (err: Error) => {
        sub.unsubscribe();
      },
    });
  }

  openPreviewModal() {
    const dialogRef = this.dialog.open(PreviewModalComponent, {
      data: {
        preview: this.preview,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  // file must be .png, .jpg, .jpeg extensions
  isValidFileType(file: File): boolean {
    const allowedExtensions = ['.png', '.jpg', '.jpeg'];
    const fileName = file.name.toLowerCase();
    return allowedExtensions.some((ext) => fileName.endsWith(ext));
  }
  //Drag & Drop or Browse Image

  preview: string = '';
  fileName: string = '';
  currentFile: File | null = null;
  public files: NgxFileDropEntry[] = [];

  public dropped(files: NgxFileDropEntry[]) {
    this.fileDropClass = 'dropZone';
    this.isFileUploaded = true;
    this.files = files;
    for (const droppedFile of files) {
      // Is it a file?
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          if (this.isValidFileType(file)) {
            // Here you can access the real file
            this.fileName = droppedFile.relativePath;
            this.currentFile = file;

            if (this.currentFile) {
              const file: File | null = this.currentFile;
              if (file) {
                this.preview = '';
                const reader = new FileReader();

                reader.onload = (e: any) => {
                  this.preview = e.target.result;
                };

                reader.readAsDataURL(this.currentFile);
              }
            }
          } else {
            this.toastr.error('Please Upload Valid Format');
          }
        });
      } else {
        // It was a directory (empty directories are added, otherwise only files)
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
      }
    }
  }
  removeFile() {
    this.files = [];
    this.fileName = '';
    this.preview = '';
    this.currentFile = null;
  }
  toggleChanges($event: MatSlideToggleChange) {
    this.isSlideChecked = $event.checked;
  }

  //Add stakeholder emails
  addEmail() {
    if (!this.form.get('stakeholderEmail')?.hasError('invalidEmailAddress')) {
      if (this.form.value.stakeholderEmail) {
        if (
          !this.stakeHolderEmailsArray.includes(
            this.form.value.stakeholderEmail
          )
        ) {
          this.stakeHolderEmailsArray.push(this.form.value.stakeholderEmail);
          this.form.get('stakeholderEmail')?.setValue('');
        } else {
          this.toastr.error('This Email already exist');
        }
      } else {
        this.toastr.error('Please enter valid email');
      }
    }
  }
  removeEmail(email: string) {
    let index = this.stakeHolderEmailsArray.indexOf(email);
    this.stakeHolderEmailsArray.splice(index, 1);
  }

  //get all previous order Ids
  getPreviousOrders() {
    let sub: Subscription = this.orderService
      .getAllPreviousOrders(this.siteId)
      .subscribe({
        next: (res: getPreviousOrdersModel) => {
          if (res.data) {
            this.previousOrders = res.data;
            this.filterPrevOrderList = this.previousOrders;
          }
          sub.unsubscribe();
        },
        error: (err: Error) => {
          sub.unsubscribe();
        },
      });
  }

  //get all engineer incharge
  getEngineerIncharge() {
    let sub: Subscription = this.orderService
      .getAllEngineerIncharge()
      .subscribe({
        next: (res: getAllNamesModel) => {
          if (res.data) {
            this.engineerIncharges = res.data;
          }
          sub.unsubscribe();
        },
        error: (err: Error) => {
          sub.unsubscribe();
        },
      });
  }

  //get all previous order Ids
  getPreviousRequestIds() {
    let sub: Subscription = this.orderService
      .getPreviousRequestIds(this.siteId)
      .subscribe({
        next: (res: getPreviousOrdersModel) => {
          if (res.data) {
            this.previousOrderIds = res.data;
            this.filterOrderIdList = this.previousOrderIds;
            this.filterBondingWaferOrderIdList = this.previousOrderIds;
          }
          sub.unsubscribe();
        },
        error: (err: Error) => {
          sub.unsubscribe();
        },
      });
  }

  //get all users for Order
  getUsersForOrders() {
    let sub: Subscription = this.orderService.getUserListForOrders().subscribe({
      next: (res: getAllNamesModel) => {
        if (res.data) {
          this.orderForUsersArray = res.data;
          this.filterUsersList = this.orderForUsersArray;
          this.filterProxyUsersList = this.orderForUsersArray;
          this.filterAttendantList = this.orderForUsersArray;
        }
        sub.unsubscribe();
      },
      error: (err: Error) => {
        sub.unsubscribe();
      },
    });
  }

  //get all business units
  getBusinessUnits(userId: number) {
    let sub: Subscription = this.orderService
      .getAllBusinessUnits(userId)
      .subscribe({
        next: (res: getAllApiResponse) => {
          if (res?.data) {
            this.businessUnits = res.data;
          }
          sub.unsubscribe();
        },
        error: (err: Error) => {
          sub.unsubscribe();
        },
      });
  }

  siteId: number = 1;
  //get all tags
  getTagNames() {
    let sub: Subscription = this.orderService
      .getAllTags(this.siteId)
      .subscribe({
        next: (res: getAllTags) => {
          this.tagNames = res.data.map((tag) => tag.tagName);
          sub.unsubscribe();
        },
        error: (err: Error) => {
          sub.unsubscribe();
        },
      });
  }

  //get all order settings
  getSettings() {
    let sub: Subscription = this.orderService.getOrderSettings().subscribe({
      next: (res: getOrderSettings) => {
        this.confidentialLevelArray = res.data.confidentialLevel;
        this.internalPriorityArray = res.data.internalPriority;
        sub.unsubscribe();
      },
      error: (err: Error) => {
        sub.unsubscribe();
      },
    });
  }

  //get all order settings
  getWaferTypes() {
    let sub: Subscription = this.orderService
      .getWaferTypes(this.siteId)
      .subscribe({
        next: (res: getAllApiResponse) => {
          this.waferTypes = res.data;
          sub.unsubscribe();
        },
        error: (err: Error) => {
          sub.unsubscribe();
        },
      });
  }

  //get all sites
  getSites() {
    let sub: Subscription = this.sharedService.getAllSites().subscribe({
      next: (res: sitesResponse) => {
        this.sites = res.data;
        this.selectedSite = this.sites?.filter(
          (site) => site.id === this.userDetails.siteId
        )[0];
        this.form.get('waferProvidedBy')?.setValue(this.selectedSite.id);
        this.form
          .get('bondingWaferProvidedBy')
          ?.setValue(this.selectedSite.name);
        this.getWaferTypes();
        this.getTagNames();

        sub.unsubscribe();
      },
      error: (err: Error) => {
        sub.unsubscribe();
      },
    });
  }

  userDetailOnOrderFor: userDetailData = {} as userDetailData;
  //get user details based on user ID
  getUserDetail() {
    let sub: Subscription = this.orderService
      .getUserDetail(this.selectedOrderForUser)
      .subscribe({
        next: (res: userDetailResponse) => {
          if (res?.data) {
            this.userDetailOnOrderFor = res.data;
            this.getBusinessUnits(this.userDetailOnOrderFor.id);

            this.form
              .get('approverManager')
              ?.setValue(this.userDetailOnOrderFor.approverName);
            this.form.get('phone')?.setValue(this.userDetailOnOrderFor.phone);
            this.form
              .get('departmentCode')
              ?.setValue(this.userDetailOnOrderFor.deptCode);
            this.form
              .get('employeeID')
              ?.setValue(this.userDetailOnOrderFor.employeeId);
          }
          sub.unsubscribe();
        },
        error: (err: Error) => {
          sub.unsubscribe();
        },
      });
  }
  //get departments as per selected site
  getDepartments() {
    let sub: Subscription = this.orderService
      .getDepartments(this.siteId, this.organizationId)
      .subscribe({
        next: (res: departmentsResponse) => {
          if (res?.data) {
            this.departments = res.data;
          }
        },
        error: (err: Error) => {
          sub.unsubscribe();
        },
      });
  }
  onSiteSelectionChange(event: MatSelectChange) {
    if (event.value) {
      this.siteId = event.value;
      this.form.get('waferProvidedBy')?.setValue(this.selectedSite.id);
      this.form.get('bondingWaferProvidedBy')?.setValue(this.selectedSite.name);
      this.getTagNames();
      this.getWaferTypes();
      this.getPreviousRequestIds();
      this.getPreviousOrders();
    }
    this.selectedSite = this.sites.filter((site) => site.id === this.siteId)[0];
  }

  prevOrderSearchStr: string = '';

  onKeyUpPrevOrder() {
    const searchString = this.prevOrderSearchStr.toLowerCase().trim();
    this.filterPrevOrderList = [
      ...new Set(
        this.previousOrders.filter((template) => {
          const searchValue = `${template.orderId}`.toLowerCase();
          return searchValue.includes(searchString);
        })
      ),
    ];
  }
  prevOrderToggle() {
    this.prevOrderSearchStr = '';
    this.filterPrevOrderList = this.previousOrders;
  }

  filterUsersList: NamesModel[] = [];
  onKeyUpOrderFor() {
    const searchString = this.orderForSearchStr.toLowerCase().trim();
    this.filterUsersList = [
      ...new Set(
        this.orderForUsersArray.filter((template) => {
          const searchValue =
            `${template.firstName} ${template.lastName}`.toLowerCase();
          return searchValue.includes(searchString);
        })
      ),
    ];
  }
  orderForToggle() {
    this.orderForSearchStr = '';
    this.filterUsersList = this.orderForUsersArray;
  }
  selectedOrderForUser: number = 0;
  onOrderForSelectionChange(event: MatSelectChange) {
    this.selectedOrderForUser = this.form.value.orderFor;
    this.getUserDetail();
    // this.filterUsersList = [...new Set(this.orderForUsersArray)];
    // this.orderForSearchStr = '';
  }

  onKeyUpProxy() {
    const searchString = this.proxyRequestorSearchStr.toLowerCase().trim();
    this.filterProxyUsersList = [
      ...new Set(
        this.orderForUsersArray.filter((template) => {
          const searchValue =
            `${template.firstName} ${template.lastName}`.toLowerCase();
          return searchValue.includes(searchString);
        })
      ),
    ];
  }
  proxyToggle() {
    this.proxyRequestorSearchStr = '';
    this.filterProxyUsersList = this.orderForUsersArray;
  }

  onKeyUpAttendant() {
    const searchString = this.attendantSearchStr.toLowerCase().trim();
    this.filterAttendantList = [
      ...new Set(
        this.orderForUsersArray.filter((template) => {
          const searchValue =
            `${template.firstName} ${template.lastName}`.toLowerCase();
          return searchValue.includes(searchString);
        })
      ),
    ];
  }
  attendantToggle() {
    this.attendantSearchStr = '';
    this.filterAttendantList = this.orderForUsersArray;
  }

  onKeyUpPreviousOrderId() {
    const searchString = this.previousOrderIdSearchStr.toLowerCase().trim();
    this.filterOrderIdList = [
      ...new Set(
        this.previousOrderIds.filter((template) => {
          const searchValue = `${template.orderId}`.toLowerCase();
          return searchValue.includes(searchString);
        })
      ),
    ];
  }
  previousOrderIdToggle() {
    this.previousOrderIdSearchStr = '';
    this.filterOrderIdList = this.previousOrderIds;
  }
  onKeyUpBondingWaferPreviousOrderID() {
    const searchString = this.bondingWaferPreviousOrderSearchStr
      .toLowerCase()
      .trim();
    this.filterBondingWaferOrderIdList = [
      ...new Set(
        this.previousOrderIds.filter((template) => {
          const searchValue = `${template.orderId}`.toLowerCase();
          return searchValue.includes(searchString);
        })
      ),
    ];
  }
  bondingWaferPreviousOrderIdToggle() {
    this.bondingWaferPreviousOrderSearchStr = '';
    this.filterBondingWaferOrderIdList = this.previousOrderIds;
  }

  updateWaferType(event: any) {
    this.selectedWafer = event.value;
  }

  createLotPayload(arr: any) {
    let orderLotModel: any = [];

    arr.forEach((item: any) => {
      let orderLotDetails = {
        id: 0,
        orderId: 0,
        lotId: '',
        assignedLotid: '',
        enableSlots: item.parentSlots.map((slot: any) => ({
          slot: slot.slot ? 1 : 0,
        })),
        isUpdated: 0,
      };

      let orderDetails = item.orderDetails.map((order: any) => {
        return {
          id: 0,
          orderLotDetailsId: 0,
          orderId: 0,
          recipeId: order.recipeId,
          orderRecipeType: order.recipeType,
          orderSiteId: this.form.get('siteName')?.value,
          siteEngineer: 0,
          orderSiteStatus: 0,
          dependentBeforeAfter: 0,
          dependentId: 0,
          note: order.recipeNote,
          enableSlots: order.childSlots.map((slot: any) => ({
            slot: slot.slot ? 1 : 0,
          })),
          toolCost: order.toolCost,
          imecEuvTime: '',
          imecTem: '',
          imecProcessDurationWafer: 0,
        };
      });

      let orderWaferDetails = {
        id: 0,
        orderLotDetailsId: 0,
        orderId: 0,
        waferId: '',
        wafers: item.wafers,
      };

      orderLotModel.push({
        orderLotDetails: orderLotDetails,
        orderDetails: orderDetails,
        orderWaferDetails: orderWaferDetails,
      });
    });

    return orderLotModel;
  }

  cancelOrder() {
    const dialogRef = this.dialog.open(ErrorModalComponent, {
      data: {
        cancelOrderWarning: true,
      },
    });
    dialogRef.afterClosed().subscribe((response: any) => {
      if (response) {
        this.router.navigate(['/admin/order/manage']);
      }
    });
  }

  validateAndCreateOrder() {
    if (!this.currentFile) {
      this.fileDropClass = 'dropZone file-not-uploaded';
      this.isFileUploaded = false;
    }
    if (this.form.valid && this.currentFile) {
      if (this.form.get('departmentCode')?.value) {
        this.submitOrder();
      } else {
        const dialogRef = this.dialog.open(ErrorModalComponent, {
          data: {
            showDepartmentCodeWarning: true,
          },
        });
        dialogRef.afterClosed().subscribe((response: any) => {
          if (response) {
            this.submitOrder();
          }
        });
      }
    } else {
      this.toastr.warning('Please enter all required fields');
    }
  }

  //on click submit order
  submitOrder() {
    // this.form.get('tagName')?.setValue(this.selectedTags);
    let payload = this.createPayload(this.orderLotModel);
    let formData = new FormData();
    let orderResponse: any;
    formData.append('DocumentFile', this.currentFile as Blob);
    this.orderService
      .submitOrder(payload)
      .pipe(
        mergeMap((createOrderResponse: createOrderApiResponse) => {
          this.savingOrder = true;
          orderResponse = createOrderResponse;
          let orderId = createOrderResponse.data.orderId;
          formData.append('OrderId', orderId);
          return this.orderService.uploadStructureImage(formData);
        })
      )
      .subscribe({
        next: (uploadImageResponse: uploadDocumentResponse) => {
          this.savingOrder = false;
          if (uploadImageResponse.status) {
            this.toastr.success(orderResponse.message);
            this.router.navigate(['/admin/order/manage']);
          } else {
            this.toastr.error(orderResponse.message);
          }
        },
        error: (err) => {
          console.error(err);
        },
      });
  }
  selectedSite: sites = {} as sites;

  ngOnInit() {
    this.themeSubscription = this.theme$.subscribe((theme: string) => {
      this.isDarkThemeEnabled = theme === 'dark';
    });

    this.userDetails = this.localStorageService.user;
    this.siteId = this.userDetails.siteId;
    this.organizationId = this.userDetails.organizationId;
    this.selectedOrderForUser = this.userDetails.id;
    this.initializeForm();
    this.formRequiredFieldValidation();

    this.getSites();
    this.getPreviousOrders();
    this.getEngineerIncharge();
    this.getPreviousRequestIds();
    this.getUsersForOrders();
    this.getBusinessUnits(this.userDetails.id);
    this.getSettings();
    this.getDepartments();

    this.roleSubscription = this.role$.subscribe((role: any) => {
      this.selectedRole = role;
      if (role.roleName === 'super_admin') {
        this.form?.get('siteName')?.enable();
      } else {
        this.form?.get('siteName')?.disable();
      }
      if (
        this.selectedRole.roleName === 'admin' ||
        this.selectedRole.roleName === 'super_admin' ||
        this.selectedRole.roleName === 'wafer_service_engineer' ||
        this.selectedRole.roleName === 'accountant'
      ) {
        this.form?.get('tagName')?.enable();
      } else {
        this.form?.get('tagName')?.disable();
      }
    });
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.roleSubscription?.unsubscribe();
  }

  formRequiredFieldValidation() {
    if (this.form.get('waferProvidedBy')?.value != 0) {
      this.form.get('waferType')?.setValidators(ValidatorsService.required);
    }

    this.form.get('proxyOrder')?.valueChanges.subscribe((value) => {
      if (value) {
        this.form
          .get('proxyRequestor')
          ?.setValidators([ValidatorsService.required, Validators.required]);
      } else {
        this.form.get('proxyRequestor')?.clearValidators();
      }
      this.form.get('proxyRequestor')?.updateValueAndValidity();
    });

    this.form.get('previouslyOrdered')?.valueChanges.subscribe((value) => {
      if (value) {
        this.form
          .get('previousOrderId')
          ?.setValidators([ValidatorsService.required, Validators.required]);
      } else {
        this.form.get('previousOrderId')?.clearValidators();
      }
      this.form.get('previousOrderId')?.updateValueAndValidity();
    });

    this.form.get('waferProvidedBy')?.valueChanges.subscribe((value) => {
      if (value > 0) {
        this.form
          .get('waferType')
          ?.setValidators([ValidatorsService.required, Validators.required]);
      } else {
        this.form.get('waferType')?.clearValidators();
      }
      this.form.get('waferType')?.updateValueAndValidity();
    });
  }

  updateLotData(event: any) {
    this.orderLotModel = event;
  }

  createFormPayload() {
    /*-- expedite flag and internal priority not in use currently
    // this.createOrderFormValues.expiditeFlag = this.form.value.expediteFlag;
    // this.createOrderFormValues.internalPriority = this.form.value.expediteFlag;
    **/

    const getBondingWaferProvidedById = () => {
      let bondingWaferProvidedBy = this.form.get(
        'bondingWaferProvidedBy'
      )?.value;

      if (bondingWaferProvidedBy == 'Customer') return 0;
      else if (bondingWaferProvidedBy == 'Previous Order') return 1;
      else if (bondingWaferProvidedBy == 'TTCA Albany') return 2;
      else if (bondingWaferProvidedBy == 'CRD Japan') return 3;
      else if (bondingWaferProvidedBy == 'TIA') return 4;
      return -1;
    };

    return {
      id: 0,
      prevOrderId: '',
      siteId: this.form.get('siteName')?.value,
      employeeId: this.form.get('employeeID')?.value,
      businessUnitId: this.form.get('businessUnit')?.value,
      orderType: 0,
      projectNumberType: this.form.get('projectNumberType')?.value,
      projectNumber: this.form.get('projectNumber')?.value,
      waferCount: 0,
      program: this.form.get('orderTitle')?.value,
      project: this.form.get('description')?.value,
      departmentId: JSON.parse(localStorage.getItem('user')!)?.departmentId,
      internalPriority: 0,
      externalPriority: 0,
      status: '',
      engineerInCharge: this.form.get('engineerInCharge')?.value,
      stakeholders: this.stakeHolderEmailsArray?.join(', '),
      tags: this.form.get('tagName')?.value?.join(','),
      // tags: this.form
      //   .get('tagName')
      //   ?.value?.filter((tag: any) => tag.tagName)
      //   ?.map((tag: any) => tag.tagName)
      //   .join(','),
      waferTypeId:
        this.form.get('waferProvidedBy')?.value != 0
          ? this.form.get('waferType')?.value?.id
          : null,
      waferCost: 0,
      desiredDate: this.form.get('desiredDeliveryDate')?.value?.toISOString(),
      committedDeliveryDate: '',
      waferShipDate: '',
      shippedDate: '',
      expediteFlag: this.form.get('expediteFlag')?.value,
      confidentialLevel: this.form.get('confidentialLevel')?.value,
      waferProvidedBy: this.form.get('waferProvidedBy')?.value,
      bondingWafer: this.form.get('isUsingBondedWafers')?.value ? 1 : 0,
      bondingWaferProvidedBy: getBondingWaferProvidedById(),
      bondingWaferOrder:
        getBondingWaferProvidedById() == 1
          ? this.form.get('bondingWaferPreviousOrder')?.value?.id
          : null,
      bondingWaferId:
        getBondingWaferProvidedById() == 1
          ? this.form.get('bondingWaferPreviousOrder')?.value?.waferTypeId
          : null,
      bondingWaferType:
        getBondingWaferProvidedById() > 1
          ? this.form.get('bondingWaferType')?.value
          : null,
      proxyReqCheck: this.form.get('proxyOrder')?.value ? 1 : 0,
      proxyRequestor: this.form.get('proxyRequestor')?.value,
      duplicateOrder: 0,
      duplicateOrderId: 0,
      typeFlag: 0,
      isAddentantOutsider: this.form.get('shipOutside')?.value ? 1 : 0,
      outsiderAttendantName: this.form.get('attendantName')?.value,
      outsiderAttendantPhone: this.form.get('attendantPhone')?.value,
      outsiderShippingTo: this.form.get('address')?.value,
      comingFrom:
        this.form.get('waferProvidedBy')?.value == 0
          ? this.form.get('comingFromAddress')?.value
          : '',
      shippingTo: this.form.get('address')?.value,
      addressAttendant: this.form.get('attendantDropdown')?.value,
      addressDepartment: this.form.get('department')?.value,
      addressCountry: this.form.get('country')?.value,
      arroverString: '',
      note: '',
      deptCode: this.form.get('departmentCode')?.value,
      orderFlag: 0,
      isNewOrRepeat: 0,
    };
  }

  createPayload(lotData: any) {
    return {
      order: this.createFormPayload(),
      orderLotModel: this.createLotPayload(lotData),
    };
  }
}
