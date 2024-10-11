import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { AppThemeState } from '../../../../../../../state-management/app.state';
import { CommonMatModule } from '../../../../../../shared-components/common-module/common-mat.module';
import { Observable, Subscription } from 'rxjs';
import { selectTheme } from '../../../../../../../state-management/change-theme/change-theme.selector';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { sites } from '../../../../../models/model.interfaces';
import { CreateOrderService } from '../../../services/create-order.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { sitesData } from '../../../../../../../global-variables';
import { ToastrService } from 'ngx-toastr';

interface OrderRecipeInterface {
  id: number;
  recipeName: string;
  parameterValueNames: string;
  recipeId: string;
  siteName: string;
  siteId: number;
  hexId: string;
  toolId: number;
  toolName: string;
  toolCost: number;
  virtualRecipe: number;
  recipeProcessParameters: string;
  processParameters: ProcessParameter[];
}

interface ProcessParameter {
  processParameterId: number;
  processParameterValues: ProcessParameterValue[];
}

interface ProcessParameterValue {
  processParameterValueId: number;
}

interface processParameterInterface {
  id: number;
  parameterName: string;
  measurementUnit: string;
  parameterValues: ParameterValue[];
}

interface ParameterValue {
  id: number;
  parameterValue: string;
  measurementUnit: string;
}

interface hexIdInterface {
  id: number;
  hexId: string;
  toolName: string;
}

interface suggestRecipePayload {
  virtualRecipe: number;
  siteId: number;
  recipeType: number;
  recipeNote: string;
  recipeProcessAreaId: number;
  suggestedRecipeParameters: SuggestedRecipeParameter[];
}

interface SuggestedRecipeParameter {
  processParameterId: number;
  processParameterName: string;
  processParameterValue: string;
  processParameterMeasurementUnit: string;
}

@Component({
  selector: 'app-recipe-modal',
  standalone: true,
  imports: [CommonMatModule],
  templateUrl: './recipe-modal.component.html',
  styleUrl: './recipe-modal.component.scss',
})
export class RecipeModalComponent implements OnInit, OnDestroy {
  theme$: Observable<string>;
  isDarkThemeEnabled: boolean = true;
  themeSubscription: Subscription = new Subscription();
  isLoading: boolean = true;
  isTabContentLoading: boolean = true;
  isRecipeSectionLoading: boolean = true;
  processArea: { id: number; type: string }[] = [];
  isProcessAreaAvailable: boolean = false;
  sites: sites[] = [];
  availableSites: sites[] = [];
  siteID: number = 0;
  selectedProcessArea: { id: number; type: string } = { id: 0, type: '' };
  selectedIndex: number = NaN;
  recipeID: number = 0;
  orderRecipe: OrderRecipeInterface[] = [];
  filteredOrderRecipe: OrderRecipeInterface[] = [];
  processParameters: processParameterInterface[] = [];
  hexIDs: hexIdInterface[] = [];
  recipeTypeId: number = 0;
  isAddButtonVisible: boolean = false;
  isTransportButtonVisible: boolean = false;

  form: FormGroup = this.fb.group({
    selectedSite: [{ value: '', disabled: true }, []],
    recipeNote: [''],
  });

  recipeTypes = [
    { id: 0, title: 'BOTH (FEOL & BEOL)' },
    { id: 1, title: 'FEOL' },
    { id: 2, title: 'BEOL' },
    { id: 3, title: 'Suggested Recipe' },
  ];

  constructor(
    private dialogRef: MatDialogRef<RecipeModalComponent>,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    private data: {
      sites: sites[];
      selectedSiteId: number;
      selectedRecipeId: number;
      selectedProcessArea: { id: number; type: string };
    },
    private store: Store<AppThemeState>,
    private fb: FormBuilder,
    private service: CreateOrderService,
    private toastr: ToastrService
  ) {
    this.theme$ = this.store.pipe(select(selectTheme));
  }

  detectChangesInForm() {
    this.form
      .get('processArea')
      ?.get(this.toCamelCase(this.selectedProcessArea.type))
      ?.get('processParameters')
      ?.valueChanges.subscribe((value: any) => {
        this.form
          ?.get('processArea')
          ?.get(this.toCamelCase(this.selectedProcessArea.type))
          ?.get('selectedRecipe')
          ?.setValue(null);
        this.filteredOrderRecipe = this.getMatchingRecipes(value);
      });

    this.form
      .get('processArea')
      ?.get(this.toCamelCase(this.selectedProcessArea.type))
      ?.get('selectedRecipe')
      ?.valueChanges.subscribe((value: any) => {
        if (value) {
          this.isAddButtonVisible = true;
        } else {
          this.isAddButtonVisible = false;
        }
      });

    this.form
      .get('processArea')
      ?.get('transportToSite')
      ?.get('transportedSite')
      ?.valueChanges.subscribe((result: any) => {
        result
          ? (this.isTransportButtonVisible = true)
          : (this.isTransportButtonVisible = false);
      });
  }

  getMatchingRecipes(selectedParams: any) {
    function isObjectEmpty(selectedParams: any): boolean {
      return Object.keys(selectedParams).every((key) => {
        const value = selectedParams[key];
        if (Array.isArray(value)) {
          return value.length === 0;
        }
        return value === undefined || value === null || value === '';
      });
    }

    if (isObjectEmpty(selectedParams)) {
      return this.orderRecipe;
    } else {
      let matchingRecipes = this.orderRecipe;

      // for virtual recipe filter
      if (selectedParams.virtualRecipe !== '') {
        matchingRecipes = matchingRecipes.filter(
          (recipe: OrderRecipeInterface) => {
            return recipe.virtualRecipe === selectedParams.virtualRecipe;
          }
        );
      }

      // for hex id filter
      if (selectedParams.toolId && selectedParams.toolId.length) {
        matchingRecipes = matchingRecipes.filter(
          (recipe: OrderRecipeInterface) => {
            if (selectedParams.toolId.includes(recipe.toolId)) {
              return recipe;
            }
            return;
          }
        );
      }

      let pairs = [];

      for (let key in selectedParams) {
        if (key !== 'virtualRecipe' && key !== 'toolId') {
          let valuesArray = selectedParams[key];
          let groupedValues: any = {};

          valuesArray.forEach((item: any) => {
            let parameterId = item.parameterId;

            if (!groupedValues[parameterId]) {
              groupedValues[parameterId] = {
                processParameterId: parameterId,
                processParameterValues: [],
              };
            }

            groupedValues[parameterId].processParameterValues.push({
              processParameterValueId: item.id,
            });
          });

          for (let parameterId in groupedValues) {
            pairs.push(groupedValues[parameterId]);
          }
        }
      }

      function filterRecipes(pairs: any, recipes: any) {
        return recipes.filter((recipe: any) => {
          console.log(recipe);

          return pairs.every((pair: any) => {
            console.log(pair);

            return recipe?.processParameters?.some((param: any) => {
              return (
                param.processParameterId === pair.processParameterId &&
                param.processParameterValues.some((rpv: any) =>
                  pair.processParameterValues.some(
                    (pv: any) =>
                      rpv.processParameterValueId === pv.processParameterValueId
                  )
                )
              );
            });
          });
        });
      }
      matchingRecipes = filterRecipes(pairs, matchingRecipes);

      // Iterate over the object keys
      // const pairs: {
      //   processParameterId: number;
      //   processParameterValueId: number;
      // }[] = [];

      // for (const key in selectedParams) {
      //   if (key !== 'virtualRecipe' && key !== 'toolId') {
      //     selectedParams[key].forEach((item: any) => {
      //       pairs.push({
      //         processParameterId: item.parameterId,
      //         processParameterValueId: item.id,
      //       });
      //     });
      //   }
      // }

      // if (pairs.length) {
      //   matchingRecipes = matchingRecipes.filter(
      //     (recipe: OrderRecipeInterface) => {
      //       return pairs.every(
      //         (pair: {
      //           processParameterId: number;
      //           processParameterValueId: number;
      //         }) => {
      //           return recipe.processParameters?.some(
      //             (param: ProcessParameter) => {
      //               return (
      //                 param.processParameterId === pair.processParameterId &&
      //                 param.processParameterValues?.some(
      //                   (value: ProcessParameterValue) =>
      //                     value.processParameterValueId ===
      //                     pair.processParameterValueId
      //                 )
      //               );
      //             }
      //           );
      //         }
      //       );
      //     }
      //   );
      // }

      return matchingRecipes;
    }
  }

  onTabChange(event: MatTabChangeEvent) {
    this.recipeTypeId = event.index;
    this.isRecipeSectionLoading = true;
    this.isAddButtonVisible = false;
    this.recipeID = event.index;
    if (event.index !== 3) {
      this.getOrderRecipe();
    } else {
      this.isRecipeSectionLoading = false;
    }
    this.filteredOrderRecipe = [];
    this.orderRecipe = [];
    this.form
      .get('processArea')
      ?.get(this.toCamelCase(this.selectedProcessArea.type))
      ?.get('selectedRecipe')
      ?.setValue(null);
  }

  bindInputData() {
    this.sites = this.data.sites;
    this.siteID = this.data?.selectedSiteId;
    this.form.get('selectedSite')?.setValue(this.siteID);
    this.selectedIndex = 0;
  }

  getProcessParametersAndRecipe() {
    this.isTabContentLoading = true;
    this.isRecipeSectionLoading = true;
    this.getProcessParameters();
    this.getProcessTools();
    this.getOrderRecipe();
  }

  getProcessArea() {
    let sub: Subscription = this.service
      .getProcessAreas(this.siteID)
      .subscribe({
        next: (response: { id: number; type: string }[]) => {
          this.isLoading = false;
          this.isProcessAreaAvailable = response && response.length > 0;

          if (this.isProcessAreaAvailable) {
            this.processArea = response;
            if (this.data.selectedProcessArea?.id) {
              this.selectedProcessArea = this.processArea.find(
                (processArea: { id: number; type: string }) =>
                  processArea.id === this.data.selectedProcessArea.id
              )!;
              let index = this.processArea.findIndex(
                (obj) => obj.id === this.data.selectedProcessArea.id
              );
              this.setActiveProcessAndGetData(
                this.data.selectedProcessArea,
                index
              );
            } else {
              this.selectedProcessArea = this.processArea[0];
            }
            this.createProcessAreaFormGroup(this.processArea);
            this.getProcessParametersAndRecipe();
          }

          sub.unsubscribe();
        },
        error: (error: HttpErrorResponse) => {
          console.error('ERROR', error);
          sub.unsubscribe();
        },
      });
  }

  createProcessAreaFormGroup(groups: { id: number; type: string }[]) {
    this.form.addControl('processArea', this.fb.group({}));
    let fg = this.form.get('processArea') as FormGroup;
    groups.forEach((group: { id: number; type: string }) => {
      fg.addControl(this.toCamelCase(group.type), this.fb.group({}));
    });
    fg.addControl('transportToSite', this.fb.group({}));
  }

  createDynamicFormControl(controls: processParameterInterface[]) {
    let formGroup = this.form.get('processArea') as FormGroup;

    let nestedFormGroup = formGroup.get(
      this.toCamelCase(this.selectedProcessArea.type)
    ) as FormGroup;
    nestedFormGroup?.addControl('processParameters', this.fb.group({}));
    nestedFormGroup?.addControl('suggestedRecipe', this.fb.group({}));

    let processParametersFG = nestedFormGroup.get(
      'processParameters'
    ) as FormGroup;

    let suggestionFormGroup = nestedFormGroup.get(
      'suggestedRecipe'
    ) as FormGroup;

    let transportSiteGroup = formGroup.get('transportToSite') as FormGroup;
    transportSiteGroup?.addControl('transportedSite', new FormControl());

    processParametersFG?.addControl('virtualRecipe', new FormControl(0, []));

    for (let i = 0; i < controls.length; i++) {
      processParametersFG?.addControl(
        `${this.toCamelCase(controls[i].parameterName)}`,
        new FormControl([], [])
      );
      suggestionFormGroup.addControl(
        `${this.toCamelCase(controls[i].parameterName)}`,
        new FormControl('', []) as AbstractControl
      );
    }

    processParametersFG?.addControl('toolId', new FormControl([], []));
    nestedFormGroup?.addControl('selectedRecipe', new FormControl('', []));
    nestedFormGroup?.addControl('recipeNote', new FormControl('', []));
    suggestionFormGroup?.addControl(
      'recipeNote',
      new FormControl('', [Validators.required])
    );
    this.detectChangesInForm();
  }

  getProcessParameters() {
    let sub: Subscription = this.service
      .getProcessParameters(this.selectedProcessArea.id)
      .subscribe({
        next: (response: processParameterInterface[]) => {
          this.isTabContentLoading = false;
          this.processParameters = response;
          this.createDynamicFormControl(this.processParameters);
          sub.unsubscribe();
        },
        error: (error: HttpErrorResponse) => {
          console.error('ERROR', error);
          sub.unsubscribe();
        },
      });
  }

  getProcessTools() {
    let sub = this.service
      .getProcessTools(this.siteID, this.selectedProcessArea.id)
      .subscribe({
        next: (response: hexIdInterface[]) => {
          this.hexIDs = response;
          sub.unsubscribe();
        },
        error: (error: HttpErrorResponse) => {
          console.error('ERROR', error);
          sub.unsubscribe();
        },
      });
  }

  getOrderRecipe() {
    const sub: Subscription = this.service
      .getOrderRecipe(this.siteID, this.recipeID, this.selectedProcessArea.id)
      .subscribe({
        next: (response: OrderRecipeInterface[]) => {
          this.isRecipeSectionLoading = false;
          this.orderRecipe = response;
          this.filteredOrderRecipe = response;

          if (this.data.selectedProcessArea?.id && this.data.selectedRecipeId) {
            const selectedRecipe = this.filteredOrderRecipe.find(
              (recipe: OrderRecipeInterface) =>
                recipe.id === this.data.selectedRecipeId
            );

            if (selectedRecipe) {
              this.form
                .get('processArea')
                ?.get(this.toCamelCase(this.selectedProcessArea.type))
                ?.get('selectedRecipe')
                ?.setValue(selectedRecipe);
            }
          }

          sub.unsubscribe();
        },
        error: (error: HttpErrorResponse) => {
          console.error('ERROR', error);
          sub.unsubscribe();
        },
      });
  }

  setActiveProcessAndGetData(
    process: { id: number; type: string },
    index: number
  ) {
    this.recipeTypeId = 0;
    this.selectedIndex = index;
    this.selectedProcessArea = process;
    this.form
      .get('processArea')
      ?.get(this.toCamelCase(this.selectedProcessArea.type))
      ?.get('selectedRecipe')
      ?.setValue(null);
    this.getProcessParametersAndRecipe();
  }

  closeModal() {
    this.dialogRef.close();
  }

  transportToSite(index: number) {
    this.selectedIndex = index;
    if (this.data.selectedSiteId === sitesData['ttca_albany']) {
      this.availableSites = this.sites.filter((site: sites) => {
        if (site.id === sitesData['crd_japan']) return site;
        return;
      });
    } else if (this.data.selectedSiteId === sitesData['crd_japan']) {
      this.availableSites = this.sites.filter((site: sites) => {
        if (
          site.id === sitesData['ttca_albany'] ||
          site.id === sitesData['tia']
        )
          return site;
        return;
      });
    } else if (this.data.selectedSiteId === sitesData['tia']) {
      this.availableSites = this.sites.filter((site: sites) => {
        if (site.id === sitesData['crd_japan']) return site;
        return;
      });
    } else {
      this.availableSites = this.sites;
    }
  }

  addTransportRow() {
    let selectedSite = this.form
      .get('processArea')
      ?.get('transportToSite')
      ?.get('transportedSite')?.value;
    this.dialogRef.close({ isTransportSiteRow: true, site: selectedSite });
  }

  toCamelCase(str: string): string {
    return (
      str
        // Insert a space before any uppercase letter that is not at the beginning of the string
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        // Split the string into words by spaces, hyphens, or underscores
        .split(/[\s-_]+/)
        // Map over each word to transform it into camelCase
        .map((word, index) =>
          index === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        // Join all words together to form the camelCase string
        ?.join('')
    );
  }

  addRecipe() {
    this.dialogRef.close({
      selectedRecipe: this.form
        .get('processArea')
        ?.get(this.toCamelCase(this.selectedProcessArea.type))
        ?.get('selectedRecipe')?.value,
      selectedProcessArea: this.selectedProcessArea,
      recipeNote: this.form
        .get('processArea')
        ?.get(this.toCamelCase(this.selectedProcessArea.type))
        ?.get('recipeNote')?.value,
    });
  }

  getProcessParameterDetails(key: string, value: string) {
    for (let i = 0; i < this.processParameters.length; i++) {
      if (this.toCamelCase(this.processParameters[i].parameterName) === key) {
        return {
          processParameterId: this.processParameters[i].id,
          processParameterName: this.processParameters[i].parameterName,
          processParameterMeasurementUnit:
            this.processParameters[i]?.measurementUnit ?? null,
          processParameterValue: value,
        };
      }
    }
    return;
  }

  createPayload() {
    let payload: suggestRecipePayload = {
      virtualRecipe: 0,
      recipeType: 0,
      siteId: this.data?.selectedSiteId,
      recipeNote: this.form
        .get('processArea')
        ?.get(this.toCamelCase(this.selectedProcessArea.type))
        ?.get('suggestedRecipe')
        ?.get('recipeNote')?.value,
      recipeProcessAreaId: this.selectedProcessArea.id,
      suggestedRecipeParameters: [],
    };

    let group = this.form
      .get('processArea')
      ?.get(this.toCamelCase(this.selectedProcessArea.type))
      ?.get('suggestedRecipe')?.value;
    for (let key in group) {
      if (group[key] && key != 'recipeNote') {
        payload.suggestedRecipeParameters.push(
          this.getProcessParameterDetails(
            key,
            group[key]
          ) as SuggestedRecipeParameter
        );
      }
    }
    return payload;
  }

  validateData(): boolean {
    if (
      this.form
        .get('processArea')
        ?.get(this.toCamelCase(this.selectedProcessArea.type))
        ?.get('suggestedRecipe')
        ?.get('recipeNote')?.errors
    ) {
      return false;
    }
    return true;
  }

  addSuggestedRecipe() {
    if (this.validateData()) {
      let payload: suggestRecipePayload = this.createPayload();

      let sub: Subscription = this.service
        .postSuggestedOrderRecipe(payload)
        .subscribe({
          next: (response: any) => {
            this.dialogRef.close({
              selectedRecipe: response?.data,
            });
            sub?.unsubscribe();
          },
          error: (error: HttpErrorResponse) => {
            console.error('ERROR', error);
            sub?.unsubscribe();
          },
        });
    } else {
      this.toastr.warning('Please enter all required fields');
    }
  }

  onOptionSelection(param: any, selectedOptions: any[]): void {
    let processArea = this.form
      .get('processArea')
      ?.get(this.toCamelCase(this.selectedProcessArea.type));
    processArea
      ?.get('processParameters')
      ?.get(this.toCamelCase(param.parameterName))
      ?.setValue(selectedOptions);
    processArea?.get('selectedRecipe')?.setValue(null);
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.themeSubscription = this.theme$.subscribe((theme: string) => {
      this.isDarkThemeEnabled = theme === 'dark';
    });

    this.bindInputData();
    this.getProcessArea();

    // this.form.get('selectedSite')?.valueChanges.subscribe((value: number) => {
    // this.siteID = value;
    // this.getProcessArea();
    // });
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.themeSubscription.unsubscribe();
  }
}
