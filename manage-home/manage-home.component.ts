import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription, forkJoin } from 'rxjs';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { HomeService } from '../../services/home.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HomeLinks, Links, setIsInclude } from '../../models/model.interfaces';
import { environment } from '../../../../../environments/environment';
import { LanguageService } from '../../services/language.service';
import { FooterCopyRightComponent } from '../../../shared-components/footer-copy-right/footer-copy-right.component';
import { Store } from '@ngrx/store';
import { AppThemeState } from '../../../../state-management/app.state';
import { selectTheme } from '../../../../state-management/change-theme/change-theme.selector';
import { BreadcrumbsComponent } from '../../../shared-components/breadcrumbs/breadcrumbs.component';
import { NgxFileDropEntry, NgxFileDropModule } from 'ngx-file-drop';
import { CommonMatModule } from '../../../shared-components/common-module/common-mat.module';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './manage-home.component.html',
  standalone: true,
  styleUrls: ['./manage-home.component.scss'],
  imports: [
    CdkDropList,
    CdkDrag,
    FooterCopyRightComponent,
    BreadcrumbsComponent,
    NgxFileDropModule,
    CommonMatModule,
  ],
})
export class ManageHomeComponent implements OnInit, OnDestroy {
  currentFile?: File;
  preview = '';
  availableLinks: Links[] = [];
  selectedImage?: File;
  manageHomeLabels: any;
  homeHeading: string = '';
  isIncludedPayload: setIsInclude[] = [];
  Links: Subscription = new Subscription();
  HeadingImgSub: Subscription = new Subscription();
  updateLinkSub: Subscription = new Subscription();
  languageCode: string = '';
  theme$: Observable<string>;
  isDarkThemeEnabled: boolean = true;
  themeSubscription: Subscription = new Subscription();
  pageDetails: any = {
    name: 'Manage Home',
    path: 'Home - Manage Home',
  };
  form: FormGroup = new FormGroup({
    headingFormControl: new FormControl('', [Validators.required]),
  });
  errorMessage: string = '';

  constructor(
    private homeApi: HomeService,
    private languageService: LanguageService,
    private store: Store<AppThemeState>,
    private toastr: ToastrService
  ) {
    this.languageService.localizationText.subscribe((data: any) => {
      this.manageHomeLabels = data;
      this.pageDetails = {
        name: this.manageHomeLabels.HOME_MANAGE_HOME_BREADCRUMB?.length
          ? this.manageHomeLabels.HOME_MANAGE_HOME_BREADCRUMB[0]
          : 'Manage Home',
        path: this.manageHomeLabels.HOME_MANAGE_HOME_BREADCRUMB?.length
          ? this.manageHomeLabels.HOME_MANAGE_HOME_BREADCRUMB[1]
          : 'Home - Manage Home',
      };
    });

    this.languageService.selectedLang.subscribe((code) => {
      this.languageCode = code;
    });

    this.theme$ = this.store.select(selectTheme);
  }

  //triggers whenever any list item is dragged and dropped
  drop(event: CdkDragDrop<string[]>) {
    // If moving downwards (from higher index to lower index)
    if (event.currentIndex > event.previousIndex) {
      for (let i = event.previousIndex; i <= event.currentIndex; i++) {
        this.availableLinks[i].sortOrder--; // Decrease sortOrder for upper lists
      }
    }
    // If moving upwards (from lower index to higher index)
    else if (event.currentIndex < event.previousIndex) {
      for (let i = event.currentIndex; i < event.previousIndex; i++) {
        this.availableLinks[i].sortOrder++; // Increase sortOrder for lower lists
      }
    }

    moveItemInArray(
      this.availableLinks,
      event.previousIndex,
      event.currentIndex
    );

    // Update sortOrder of the dragged link based on its new index
    this.availableLinks[event.currentIndex].sortOrder = event.currentIndex + 1;
  }

  public files: NgxFileDropEntry[] = [];

  //Drag & Drop or Browse Logo
  public dropped(files: NgxFileDropEntry[]) {
    this.errorMessage = '';
    this.files = files;
    for (const droppedFile of files) {
      // Is it a file?
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          // Here you can access the real file
          if (this.isValidFileType(file)) {
            this.selectedImage = file;
            if (this.selectedImage) {
              const file: File | null = this.selectedImage;
              if (file) {
                this.preview = '';
                const reader = new FileReader();

                reader.onload = (e: any) => {
                  this.preview = e.target.result;
                };

                reader.readAsDataURL(this.selectedImage);
              }
            }
          } else {
            this.errorMessage = 'Invalid file. Please enter a valid file.';
          }
        });
      } else {
        // It was a directory (empty directories are added, otherwise only files)
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
      }
    }
  }

  // file must be  csv, xls and xlsx extensions
  isValidFileType(file: File): boolean {
    const allowedExtensions = ['.jpeg', '.jpg', '.png'];
    const fileName = file.name.toLowerCase();
    return allowedExtensions.some((ext) => fileName.endsWith(ext));
  }

  //get all available links list
  getAllHomeLinks() {
    this.Links = this.homeApi.getAllHomelinks().subscribe({
      next: (result: HomeLinks) => {
        this.form
          .get('headingFormControl')
          ?.setValue(result.data[0].headingText);
        this.preview =
          `${environment.loginUrl}/${result.data[0].logoImage}` || '';
        for (let i = 1; i < result.data.length; i++) {
          this.availableLinks = result.data
            .slice(1)
            .sort((a, b) => a.sortOrder - b.sortOrder);
        }
      },
      error: (error: HttpErrorResponse) => console.error('Error', error),
    });
  }

  //on check/uncheck links
  setIsIncluded(linkId: number, isIncluded: boolean) {
    const index = this.availableLinks.findIndex((item) => item.id === linkId);
    this.availableLinks[index].isIncluded = !isIncluded;
  }

  //onclick - update button
  updateChanges() {
    if (this.form.get('headingFormControl')?.errors) {
      this.toastr.warning('Please enter heading');
      return;
    }

    this.isIncludedPayload = [];
    for (let i = 0; i < this.availableLinks.length; i++) {
      this.isIncludedPayload.push({
        id: this.availableLinks[i].id,
        isIncluded: this.availableLinks[i].isIncluded,
        sortOrder: this.availableLinks[i].sortOrder,
      });
    }
    let formData = new FormData();
    formData.append('HeadingText', this.form.get('headingFormControl')?.value);
    formData.append('LogoImage', this.selectedImage as Blob);

    let sources = [
      this.homeApi.setIsIncluded(this.isIncludedPayload),
      this.homeApi.setHeadingAndImage(formData),
    ];

    forkJoin(sources).subscribe({
      next: (result) => {
        this.getAllHomeLinks();
        this.toastr.success('Updated');
        // this.headingFormControl.reset();
      },
      error: (error: HttpErrorResponse) => {
        this.toastr.error('An Error Occur! Unable to update');
        return false;
      },
    });
  }
  //onclick - cancel button
  cancelChanges() {
    this.getAllHomeLinks();
    // this.headingFormControl.reset();
    this.toastr.info('Changes Cancelled');
  }

  ngOnInit() {
    this.getAllHomeLinks();
    this.themeSubscription = this.theme$.subscribe((theme: string) => {
      this.isDarkThemeEnabled = theme === 'dark';
    });
  }
  ngOnDestroy() {
    this.themeSubscription?.unsubscribe();
    this.Links.unsubscribe();
    this.HeadingImgSub.unsubscribe();
    this.updateLinkSub.unsubscribe();
  }
}
