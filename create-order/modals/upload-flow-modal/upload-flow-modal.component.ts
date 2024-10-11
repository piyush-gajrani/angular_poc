import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonMatModule } from '../../../../../../shared-components/common-module/common-mat.module';
import { Observable, Subscription } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { AppThemeState } from '../../../../../../../state-management/app.state';
import { selectTheme } from '../../../../../../../state-management/change-theme/change-theme.selector';
import { CreateOrderService } from '../../../services/create-order.service';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-upload-flow-modal',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogModule, CommonMatModule],
  templateUrl: './upload-flow-modal.component.html',
  styleUrl: './upload-flow-modal.component.scss',
})
export class UploadFlowModalComponent implements OnInit, OnDestroy {
  theme$: Observable<string>;
  themeSubscription: Subscription = new Subscription();
  isDarkThemeEnabled: boolean = true;
  recipeIdsArray: any = [];
  overwriteExisting: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { preview: string },
    public dialogRef: MatDialogRef<UploadFlowModalComponent>,
    private store: Store<AppThemeState>,
    private toastr: ToastrService
  ) {
    this.theme$ = this.store.pipe(select(selectTheme));
  }
  closeModal() {
    this.dialogRef.close();
  }
  totalRowsInFile: number = 0;
  totalColumnsInFile: number = 0;
  validCSV: boolean = false;

  isCSVFile(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension === 'csv';
  }
  isHtmFile(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension === 'htm';
  }

  onFileSelected(event: any) {
    let fileInvalid = false;
    this.recipeIdsArray = [];
    const file: File = event.target.files[0];
    if (!file) {
      return;
    }

    if (this.isCSVFile(file.name)) {
      this.readFile(file)
        .then((csvData: string) => {
          let csvRows = csvData.split('\n');
          this.totalRowsInFile = csvRows.length;

          csvRows.forEach((csvRow, index) => {
            if (fileInvalid) {
              return;
            }

            if (csvRow.trim() === '') {
              return;
            }

            let rowValues = this.parseCSVRow(csvRow);
            this.totalColumnsInFile = rowValues.length;

            // Check for invalid conditions
            if (
              (this.totalColumnsInFile > 6 &&
                index === 14 &&
                rowValues[11] !== 'Default Logical Recipe') ||
              this.totalColumnsInFile < 6
            ) {
              this.toastr.error('File is Invalid');
              event.target.value = '';
              fileInvalid = true;
              return;
            }

            if (this.totalColumnsInFile === 6) {
              this.recipeIdsArray.push(rowValues[5]);
            } else if (this.totalColumnsInFile > 6) {
              if (
                index > 14 &&
                rowValues[11] !== 'DISPOSOL.1' &&
                rowValues[11] !== ''
              ) {
                this.recipeIdsArray.push(rowValues[11]);
              }
            }
          });
        })
        .catch((error) => {
          this.toastr.error('Error reading file');
        });
    } else if (this.isHtmFile(file.name)) {
      // Process HTML file
      this.readFile(file)
        .then((htmData: string) => {
          this.recipeIdsArray = this.extractColumnFromHTML(htmData, 11);
          if (!this.recipeIdsArray) {
            event.target.value = '';
          }
        })
        .catch((error) => {
          this.toastr.error('Error reading HTML file');
        });
    } else {
      // Invalid file format
      this.toastr.error('Invalid File Format');
      event.target.value = '';
    }
  }
  extractColumnFromHTML(htmlString: string, columnIndex: number) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const tables = doc.getElementsByTagName('table');

    if (tables.length > 1) {
      const secondTable: any = tables[1]; // Assuming it's the second table

      if (
        secondTable.rows[0].cells[11].textContent.trim() !==
        'Default Logical Recipe'
      ) {
        this.toastr.error('File is Invalid');
        return;
      }

      const data = [];
      for (let i = 2; i < secondTable.rows.length; i++) {
        const row: any = secondTable.rows[i];
        if (
          row.cells.length > columnIndex &&
          row.cells[columnIndex].textContent.trim() != 'DISPOSOL.1' &&
          row.cells[columnIndex] != ''
        ) {
          data.push(row.cells[columnIndex].textContent.trim());
        }
      }
      return data;
    } else {
      this.toastr.error('Invalid Data File Selected');
      return;
    }
  }

  private readFile(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const csvData: string = e.target.result;
        resolve(csvData);
      };

      reader.onerror = (e) => {
        reject(e);
      };

      reader.readAsText(file);
    });
  }

  private parseCSVRow(csvRow: string): string[] {
    // Regular expression to handle CSV rows with quoted fields containing commas
    const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
    let matches = csvRow.match(regex);

    if (!matches) {
      return [];
    }

    // Remove leading/trailing commas and quotes, and trim each value
    let rowValues = matches.map((match) => {
      return match
        .replace(/(^,)|(,$)/g, '')
        .replace(/(^")|("$)/g, '')
        .trim();
    });

    return rowValues;
  }

  uploadFlow() {
    if (this.recipeIdsArray && this.recipeIdsArray.length) {
      let recipeIds: string[] = [];
      this.recipeIdsArray?.forEach((id: string, i: number) => {
        if (!recipeIds.includes(id)) {
          recipeIds.push(id);
        }
      });

      let payload = {
        recipeIds: recipeIds,
      };
      let uploadFlowData = {
        overwriteExisting: this.overwriteExisting,
        uploadedRecipeIdsArray: this.recipeIdsArray,
        payload: payload,
      };
      this.dialogRef.close(uploadFlowData);
    } else {
      this.toastr.warning('Please select valid file');
    }
  }
  Overwrite(event: any) {
    this.overwriteExisting = event.checked;
  }

  ngOnInit(): void {
    this.themeSubscription = this.theme$.subscribe((theme: string) => {
      this.isDarkThemeEnabled = theme === 'dark';
    });
  }
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.themeSubscription.unsubscribe();
  }
}
